"""Graph database integration using Neo4j for relationship modeling."""

import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

from neo4j import AsyncGraphDatabase, AsyncDriver
from neo4j.exceptions import ServiceUnavailable, AuthError
from cachetools import TTLCache

from .models import Expert, TaskType

logger = logging.getLogger(__name__)


class GraphDatabaseManager:
    """Manage graph database operations with Neo4j."""
    
    def __init__(
        self,
        uri: Optional[str] = None,
        username: str = "neo4j",
        password: Optional[str] = None,
        cache_ttl: int = 600  # 10 minutes
    ):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.driver: Optional[AsyncDriver] = None
        
        # Cache for query results
        self.query_cache = TTLCache(maxsize=500, ttl=cache_ttl)
        
    async def initialize(self):
        """Initialize connection and create schema."""
        try:
            self.driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
            
            # Verify connectivity
            async with self.driver.session() as session:
                await session.run("RETURN 1")
                
            # Create schema
            await self._create_schema()
            
            logger.info(f"Connected to Neo4j at {self.uri}")
            
        except ServiceUnavailable:
            logger.error(f"Neo4j service unavailable at {self.uri}")
            raise
        except AuthError:
            logger.error("Neo4j authentication failed")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j: {e}")
            raise
            
    async def _create_schema(self):
        """Create indexes and constraints."""
        schema_queries = [
            # Constraints
            "CREATE CONSTRAINT expert_id IF NOT EXISTS FOR (e:Expert) REQUIRE e.id IS UNIQUE",
            "CREATE CONSTRAINT tech_name IF NOT EXISTS FOR (t:Technology) REQUIRE t.name IS UNIQUE",
            "CREATE CONSTRAINT domain_name IF NOT EXISTS FOR (d:Domain) REQUIRE d.name IS UNIQUE",
            "CREATE CONSTRAINT pattern_id IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE",
            
            # Indexes
            "CREATE INDEX expert_name IF NOT EXISTS FOR (e:Expert) ON (e.name)",
            "CREATE INDEX expert_version IF NOT EXISTS FOR (e:Expert) ON (e.version)",
            "CREATE INDEX tech_category IF NOT EXISTS FOR (t:Technology) ON (t.category)",
            "CREATE INDEX task_type IF NOT EXISTS FOR (t:Task) ON (t.type)",
            "CREATE INDEX task_timestamp IF NOT EXISTS FOR (t:Task) ON (t.timestamp)"
        ]
        
        async with self.driver.session() as session:
            for query in schema_queries:
                try:
                    await session.run(query)
                except Exception as e:
                    # Ignore if constraint/index already exists
                    if "already exists" not in str(e):
                        logger.error(f"Schema creation error: {e}")
                        
    async def index_expert(self, expert: Expert) -> bool:
        """Index an expert with all relationships in the graph."""
        try:
            async with self.driver.session() as session:
                # Create or update expert node
                await session.run("""
                    MERGE (e:Expert {id: $id})
                    SET e.name = $name,
                        e.version = $version,
                        e.description = $description,
                        e.updated_at = datetime()
                """, {
                    "id": expert.id,
                    "name": expert.name,
                    "version": expert.version,
                    "description": expert.description
                })
                
                # Create domain relationships
                for domain in expert.domains:
                    await session.run("""
                        MERGE (d:Domain {name: $domain})
                        MERGE (e:Expert {id: $expert_id})
                        MERGE (e)-[:BELONGS_TO]->(d)
                    """, {"domain": domain, "expert_id": expert.id})
                    
                # Create technology relationships
                for spec in expert.specializations:
                    await session.run("""
                        MERGE (t:Technology {name: $tech})
                        SET t.category = COALESCE(t.category, 'general')
                        MERGE (e:Expert {id: $expert_id})
                        MERGE (e)-[r:SPECIALIZES_IN]->(t)
                        SET r.expertise_level = $level,
                            r.frameworks = $frameworks
                    """, {
                        "tech": spec.technology,
                        "expert_id": expert.id,
                        "level": spec.expertise_level,
                        "frameworks": spec.frameworks
                    })
                    
                    # Create framework relationships
                    for framework in spec.frameworks:
                        await session.run("""
                            MERGE (f:Technology {name: $framework})
                            SET f.category = 'framework'
                            MERGE (t:Technology {name: $tech})
                            MERGE (f)-[:RELATED_TO]->(t)
                        """, {"framework": framework, "tech": spec.technology})
                        
                # Create pattern relationships
                for i, pattern in enumerate(expert.patterns):
                    await session.run("""
                        MERGE (p:Pattern {id: $pattern_id})
                        SET p.name = $pattern,
                            p.description = $pattern
                        MERGE (e:Expert {id: $expert_id})
                        MERGE (e)-[:USES_PATTERN]->(p)
                    """, {
                        "pattern_id": f"{expert.id}_pattern_{i}",
                        "pattern": pattern,
                        "expert_id": expert.id
                    })
                    
                # Clear cache entries for this expert
                self._clear_expert_cache(expert.id)
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to index expert {expert.id} in graph: {e}")
            return False
            
    async def find_expert_by_technologies(
        self,
        technologies: List[str],
        task_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Tuple[str, Dict[str, Any]]]:
        """Find experts by technology requirements."""
        cache_key = f"tech_search:{':'.join(sorted(technologies))}:{task_type}:{limit}"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
            
        query = """
            MATCH (t:Technology)
            WHERE t.name IN $technologies
            MATCH (e:Expert)-[r:SPECIALIZES_IN]->(t)
            WITH e, COUNT(DISTINCT t) as tech_matches, 
                 COLLECT(DISTINCT t.name) as matched_techs
            WHERE tech_matches > 0
            OPTIONAL MATCH (e)-[:SUCCEEDED_WITH]->(task:Task)
            WHERE task.type = $task_type
            WITH e, tech_matches, matched_techs, 
                 COUNT(task) as success_count
            ORDER BY tech_matches DESC, success_count DESC
            LIMIT $limit
            RETURN e.id as expert_id, 
                   e.name as expert_name,
                   tech_matches,
                   matched_techs,
                   success_count,
                   tech_matches * 1.0 / $total_techs as coverage
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, {
                "technologies": technologies,
                "task_type": task_type,
                "limit": limit,
                "total_techs": len(technologies)
            })
            
            experts = []
            async for record in result:
                expert_data = {
                    "expert_name": record["expert_name"],
                    "tech_matches": record["tech_matches"],
                    "matched_techs": record["matched_techs"],
                    "success_count": record["success_count"],
                    "coverage": record["coverage"]
                }
                experts.append((record["expert_id"], expert_data))
                
        self.query_cache[cache_key] = experts
        return experts
        
    async def find_expert_combinations(
        self,
        technologies: List[str],
        team_size: int = 2,
        limit: int = 3
    ) -> List[Tuple[List[str], float, Dict[str, Any]]]:
        """Find complementary expert combinations."""
        if team_size != 2:
            # For now, only support pairs
            logger.warning("Only team_size=2 is currently supported")
            team_size = 2
            
        cache_key = f"team_search:{':'.join(sorted(technologies))}:{team_size}:{limit}"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
            
        query = """
            MATCH (t1:Technology)<-[:SPECIALIZES_IN]-(e1:Expert)
            WHERE t1.name IN $technologies
            MATCH (t2:Technology)<-[:SPECIALIZES_IN]-(e2:Expert)
            WHERE t2.name IN $technologies 
              AND e1.id < e2.id
              AND NOT (e1)-[:SPECIALIZES_IN]->(t2)
            WITH e1, e2,
                 COLLECT(DISTINCT t1.name) as e1_techs,
                 COLLECT(DISTINCT t2.name) as e2_techs
            WITH e1, e2, e1_techs, e2_techs,
                 (e1_techs + e2_techs) as combined_techs
            WITH e1, e2, e1_techs, e2_techs,
                 SIZE([t IN $technologies WHERE t IN combined_techs]) as coverage_count
            WHERE coverage_count >= SIZE($technologies) * 0.8
            OPTIONAL MATCH (e1)-[:WORKED_WITH]->(e2)
            WITH e1, e2, e1_techs, e2_techs, coverage_count,
                 COUNT(*) > 0 as have_worked_together
            RETURN e1.id as expert1_id,
                   e2.id as expert2_id,
                   e1_techs,
                   e2_techs,
                   coverage_count * 1.0 / SIZE($technologies) as coverage,
                   have_worked_together
            ORDER BY coverage DESC, have_worked_together DESC
            LIMIT $limit
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, {
                "technologies": technologies,
                "limit": limit
            })
            
            combinations = []
            async for record in result:
                team = [record["expert1_id"], record["expert2_id"]]
                coverage = record["coverage"]
                metadata = {
                    "expert1_techs": record["e1_techs"],
                    "expert2_techs": record["e2_techs"],
                    "have_worked_together": record["have_worked_together"]
                }
                combinations.append((team, coverage, metadata))
                
        self.query_cache[cache_key] = combinations
        return combinations
        
    async def explore_expert_network(
        self,
        expert_id: str,
        depth: int = 2,
        relationship_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Explore expert relationships and networks."""
        if not relationship_types:
            relationship_types = ["SPECIALIZES_IN", "COMPATIBLE_WITH", "EVOLVED_FROM"]
            
        cache_key = f"network:{expert_id}:{depth}:{':'.join(sorted(relationship_types))}"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
            
        # Build relationship pattern
        rel_pattern = "|".join(relationship_types)
        
        query = f"""
            MATCH path = (e:Expert {{id: $expert_id}})-[:{rel_pattern}*1..{depth}]-(connected)
            WITH e, connected, path,
                 [r IN relationships(path) | type(r)] as rel_types,
                 length(path) as distance
            RETURN DISTINCT 
                   labels(connected)[0] as node_type,
                   CASE 
                     WHEN 'Expert' IN labels(connected) THEN connected.id
                     WHEN 'Technology' IN labels(connected) THEN connected.name
                     WHEN 'Domain' IN labels(connected) THEN connected.name
                     ELSE connected.id
                   END as node_id,
                   CASE 
                     WHEN 'Expert' IN labels(connected) THEN connected.name
                     ELSE connected.name
                   END as node_name,
                   rel_types,
                   distance
            ORDER BY distance, node_type, node_id
            LIMIT 50
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, {"expert_id": expert_id})
            
            network = {
                "center": expert_id,
                "nodes": [],
                "relationships": []
            }
            
            async for record in result:
                node = {
                    "type": record["node_type"],
                    "id": record["node_id"],
                    "name": record["node_name"],
                    "distance": record["distance"],
                    "relationship_path": record["rel_types"]
                }
                network["nodes"].append(node)
                
        self.query_cache[cache_key] = network
        return network
        
    async def get_expert_lineage(self, expert_id: str) -> Dict[str, Any]:
        """Get expert evolution and version history."""
        cache_key = f"lineage:{expert_id}"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
            
        query = """
            MATCH (e:Expert {id: $expert_id})
            OPTIONAL MATCH (e)-[:EVOLVED_FROM*]->(previous:Expert)
            OPTIONAL MATCH (e)-[:RELATED_TO]-(related:Expert)
            OPTIONAL MATCH (e)-[:USES_PATTERN]->(p:Pattern)
            RETURN e.id as expert_id,
                   e.name as expert_name,
                   e.version as version,
                   COLLECT(DISTINCT previous) as previous_versions,
                   COLLECT(DISTINCT related) as related_experts,
                   COLLECT(DISTINCT p.name) as patterns
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, {"expert_id": expert_id})
            record = await result.single()
            
            if not record:
                return {}
                
            lineage = {
                "expert_id": record["expert_id"],
                "expert_name": record["expert_name"],
                "version": record["version"],
                "previous_versions": [
                    {"id": p["id"], "name": p["name"], "version": p["version"]}
                    for p in record["previous_versions"]
                ],
                "related_experts": [
                    {"id": r["id"], "name": r["name"]}
                    for r in record["related_experts"]
                ],
                "patterns": record["patterns"]
            }
            
        self.query_cache[cache_key] = lineage
        return lineage
        
    async def record_task_success(
        self,
        expert_id: str,
        task_id: str,
        task_type: TaskType,
        success: bool,
        metadata: Optional[Dict] = None
    ):
        """Record task execution result."""
        query = """
            MERGE (e:Expert {id: $expert_id})
            MERGE (t:Task {id: $task_id})
            SET t.type = $task_type,
                t.success = $success,
                t.timestamp = datetime(),
                t.metadata = $metadata
            MERGE (e)-[r:EXECUTED]->(t)
            SET r.timestamp = datetime()
        """
        
        if success:
            query += "\nMERGE (e)-[:SUCCEEDED_WITH]->(t)"
            
        async with self.driver.session() as session:
            await session.run(query, {
                "expert_id": expert_id,
                "task_id": task_id,
                "task_type": task_type.value,
                "success": success,
                "metadata": metadata or {}
            })
            
        # Clear relevant cache entries
        self._clear_expert_cache(expert_id)
        
    async def get_technology_graph(self) -> Dict[str, Any]:
        """Get the technology relationship graph."""
        cache_key = "tech_graph"
        if cache_key in self.query_cache:
            return self.query_cache[cache_key]
            
        query = """
            MATCH (t:Technology)
            OPTIONAL MATCH (t)-[r:RELATED_TO]-(related:Technology)
            WITH t, COLLECT(DISTINCT {
                name: related.name,
                relationship: type(r)
            }) as relationships
            RETURN t.name as technology,
                   t.category as category,
                   relationships
            ORDER BY t.name
        """
        
        async with self.driver.session() as session:
            result = await session.run(query)
            
            tech_graph = {"nodes": [], "edges": []}
            tech_set = set()
            
            async for record in result:
                tech_name = record["technology"]
                if tech_name not in tech_set:
                    tech_set.add(tech_name)
                    tech_graph["nodes"].append({
                        "id": tech_name,
                        "name": tech_name,
                        "category": record["category"]
                    })
                    
                for rel in record["relationships"]:
                    if rel["name"] and rel["name"] not in tech_set:
                        tech_set.add(rel["name"])
                        tech_graph["nodes"].append({
                            "id": rel["name"],
                            "name": rel["name"],
                            "category": "related"
                        })
                        
                    tech_graph["edges"].append({
                        "source": tech_name,
                        "target": rel["name"],
                        "type": rel["relationship"]
                    })
                    
        self.query_cache[cache_key] = tech_graph
        return tech_graph
        
    def _clear_expert_cache(self, expert_id: str):
        """Clear cache entries related to an expert."""
        keys_to_remove = []
        for key in self.query_cache.keys():
            if expert_id in str(key):
                keys_to_remove.append(key)
                
        for key in keys_to_remove:
            del self.query_cache[key]
            
    async def close(self):
        """Close the database connection."""
        if self.driver:
            await self.driver.close()
            
    async def health_check(self) -> bool:
        """Check if database is accessible."""
        try:
            async with self.driver.session() as session:
                result = await session.run("RETURN 1 as health")
                record = await result.single()
                return record["health"] == 1
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False