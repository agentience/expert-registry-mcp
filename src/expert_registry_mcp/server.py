"""Expert Registry MCP Server implementation using FastMCP."""

import os
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

from fastmcp import FastMCP, Context
from pydantic import Field
from typing import Annotated

from .models import (
    Expert, TechnologyDetectionResult, ExpertSelectionResult,
    TaskType, UsageTracking, CapabilityAssessment, ExpertScore
)
from .registry import RegistryManager
from .selection import SelectionEngine
from .context import ContextManager
from .vector_db import VectorDatabaseManager
from .graph_db import GraphDatabaseManager
from .embeddings import EmbeddingPipeline
from .discovery import HybridDiscovery

logger = logging.getLogger(__name__)


class ExpertRegistryServer:
    """FastMCP server for expert registry operations with vector and graph database support."""
    
    def __init__(self, base_path: Optional[str] = None):
        # Initialize paths
        self.base_path = Path(base_path or os.getenv("EXPERT_SYSTEM_PATH", "./expert-system"))
        
        # Create FastMCP instance
        self.mcp = FastMCP(
            name="expert-registry-mcp",
            instructions="High-performance expert discovery with vector and graph database integration"
        )
        
        # Initialize core components
        self.registry_manager = RegistryManager(
            self.base_path / "registry" / "expert-registry.json"
        )
        self.selection_engine = SelectionEngine(self.registry_manager)
        self.context_manager = ContextManager(self.base_path / "expert-contexts")
        
        # Initialize database components
        self.vector_db = VectorDatabaseManager(
            persist_path=self.base_path / "vector-db",
            embedding_model=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        )
        
        self.graph_db = GraphDatabaseManager(
            uri=os.getenv("NEO4J_URI", "bolt://192.168.2.174:7687"),
            password=os.getenv("NEO4J_PASSWORD", "neo4agentience")
        )
        
        # Initialize AI components
        self.embedding_pipeline = EmbeddingPipeline(
            model_name=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        )
        
        self.hybrid_discovery = HybridDiscovery(
            registry_manager=self.registry_manager,
            vector_db=self.vector_db,
            graph_db=self.graph_db,
            embedding_pipeline=self.embedding_pipeline
        )
        
        # Performance tracking
        self.usage_tracking: Dict[str, UsageTracking] = {}
        
        # Register tools
        self._register_tools()
        
    def _register_tools(self):
        """Register all MCP tools."""
        
        # Registry Management Tools
        @self.mcp.tool
        async def expert_registry_list(
            domain: Annotated[Optional[str], Field(description="Filter by domain")] = None,
            technology: Annotated[Optional[str], Field(description="Filter by technology")] = None,
            include_metrics: Annotated[bool, Field(description="Include performance metrics")] = False
        ) -> List[Expert]:
            """List all available experts with filtering options."""
            return await self.registry_manager.list_experts(
                domain=domain,
                technology=technology,
                include_metrics=include_metrics
            )
            
        @self.mcp.tool
        async def expert_registry_get(
            expert_id: Annotated[str, Field(description="Expert ID to retrieve")],
            include_context: Annotated[bool, Field(description="Include full expert context")] = False
        ) -> Dict[str, Any]:
            """Get detailed information about a specific expert."""
            expert = await self.registry_manager.get_expert(expert_id)
            if not expert:
                raise ValueError(f"Expert not found: {expert_id}")
                
            result = {"expert": expert.model_dump()}
            
            if include_context:
                try:
                    context = await self.context_manager.load_context(expert_id)
                    result["context"] = context.content
                except FileNotFoundError:
                    result["context"] = None
                    
            return result
            
        @self.mcp.tool
        async def expert_registry_search(
            query: Annotated[str, Field(description="Search query")],
            search_fields: Annotated[Optional[List[str]], Field(
                description="Fields to search in (name, description, domains, technologies)"
            )] = None
        ) -> List[Expert]:
            """Search experts by query."""
            return await self.registry_manager.search_experts(
                query=query,
                search_fields=search_fields
            )
            
        # Selection Tools
        @self.mcp.tool
        async def expert_detect_technologies(
            scan_paths: Annotated[List[str], Field(
                description="Paths to scan for technology detection"
            )],
            include_content: Annotated[bool, Field(
                description="Analyze file contents (not just names)"
            )] = False
        ) -> TechnologyDetectionResult:
            """Detect technologies in the current context."""
            return await self.selection_engine.detect_technologies(
                scan_paths=scan_paths,
                include_content=include_content
            )
            
        @self.mcp.tool
        async def expert_select_optimal(
            task_description: Annotated[str, Field(description="Description of the task")],
            technologies: Annotated[Optional[List[str]], Field(
                description="List of technologies involved"
            )] = None,
            task_type: Annotated[Optional[TaskType], Field(
                description="Type of task (bug-fix, investigation, refactoring, feature, article)"
            )] = None,
            strategy: Annotated[str, Field(
                description="Selection strategy (single, pair, team, fallback)"
            )] = "single"
        ) -> ExpertSelectionResult:
            """Select the best expert for a task."""
            return await self.selection_engine.select_optimal_expert(
                task_description=task_description,
                technologies=technologies,
                task_type=task_type,
                strategy=strategy
            )
            
        @self.mcp.tool
        async def expert_assess_capability(
            expert_id: Annotated[str, Field(description="Expert ID to assess")],
            task_description: Annotated[str, Field(description="Task to assess capability for")],
            constraints: Annotated[Optional[Dict], Field(
                description="Task-specific constraints"
            )] = None
        ) -> CapabilityAssessment:
            """Assess expert capability for a specific task."""
            score = await self.selection_engine.assess_capability(
                expert_id=expert_id,
                task_description=task_description,
                constraints=constraints
            )
            
            return CapabilityAssessment(
                expert_id=expert_id,
                task_description=task_description,
                capability_score=score,
                confidence=0.85,
                reasoning=f"Expert assessed with {score:.0%} capability for this task"
            )
            
        # Context Tools
        @self.mcp.tool
        async def expert_load_context(
            expert_id: Annotated[str, Field(description="Expert ID to load context for")],
            sections: Annotated[Optional[List[str]], Field(
                description="Specific sections to load"
            )] = None
        ) -> Dict[str, Any]:
            """Load expert context for injection."""
            context = await self.context_manager.load_context(
                expert_id=expert_id,
                sections=sections
            )
            
            return {
                "expert_id": context.expert_id,
                "content": context.content,
                "sections": context.sections,
                "loaded_at": context.loaded_at.isoformat()
            }
            
        @self.mcp.tool
        async def expert_inject_context(
            prompt: Annotated[str, Field(description="Base prompt to enhance")],
            expert_id: Annotated[str, Field(description="Expert ID whose context to inject")],
            injection_points: Annotated[Optional[List[str]], Field(
                description="Where to inject context (constraints, patterns, quality-criteria, full)"
            )] = None
        ) -> str:
            """Inject expert context into a prompt."""
            return await self.context_manager.inject_context(
                prompt=prompt,
                expert_id=expert_id,
                injection_points=injection_points
            )
            
        # Analytics Tools
        @self.mcp.tool
        async def expert_track_usage(
            expert_id: Annotated[str, Field(description="Expert ID that was used")],
            task_id: Annotated[str, Field(description="Unique task identifier")],
            outcome: Annotated[Dict, Field(description="Task outcome details")]
        ) -> Dict[str, str]:
            """Track expert usage and performance."""
            # Create tracking entry
            task_type = TaskType(outcome.get("task_type", "general"))
            tracking = UsageTracking(
                expert_id=expert_id,
                task_id=task_id,
                task_type=task_type,
                started_at=datetime.now(),
                completed_at=datetime.now(),
                success=outcome.get("success", False),
                adherence_score=outcome.get("adherence_score"),
                error_message=outcome.get("error_message")
            )
            
            self.usage_tracking[task_id] = tracking
            
            # Record in graph database
            await self.graph_db.record_task_success(
                expert_id=expert_id,
                task_id=task_id,
                task_type=task_type,
                success=tracking.success,
                metadata={
                    "adherence_score": tracking.adherence_score,
                    "error_message": tracking.error_message
                }
            )
            
            # Add to vector database task history
            task_description = outcome.get("task_description", "")
            if task_description:
                await self.vector_db.add_task_history(
                    task_id=task_id,
                    task_description=task_description,
                    selected_expert_id=expert_id,
                    success=tracking.success,
                    metadata=outcome
                )
            
            # Update expert metrics
            if tracking.success:
                await self.registry_manager.update_expert_metrics(
                    expert_id,
                    {
                        "successful_applications": 1,  # This would be incremented in production
                        "total_applications": 1,  # This would be incremented in production
                    }
                )
                
            return {
                "status": "tracked",
                "task_id": task_id,
                "expert_id": expert_id
            }
            
        @self.mcp.tool
        async def expert_get_analytics(
            expert_id: Annotated[Optional[str], Field(
                description="Expert ID to get analytics for"
            )] = None,
            time_range: Annotated[Optional[Dict[str, str]], Field(
                description="Time range with start and end dates"
            )] = None,
            metrics: Annotated[Optional[List[str]], Field(
                description="Specific metrics to retrieve"
            )] = None
        ) -> Dict[str, Any]:
            """Get performance analytics for experts."""
            # Simple implementation - in production this would query a database
            analytics = {
                "period": time_range or {"start": "2025-01-01", "end": "2025-12-31"},
                "metrics": {}
            }
            
            if expert_id:
                expert = await self.registry_manager.get_expert(expert_id)
                if expert and expert.performance_metrics:
                    analytics["metrics"] = {
                        "average_adherence": expert.performance_metrics.average_adherence_score,
                        "success_rate": (
                            expert.performance_metrics.successful_applications /
                            expert.performance_metrics.total_applications
                            if expert.performance_metrics.total_applications > 0
                            else 0
                        ),
                        "total_uses": expert.performance_metrics.total_applications
                    }
            else:
                # Aggregate analytics
                analytics["metrics"] = {
                    "total_tasks": len(self.usage_tracking),
                    "success_rate": sum(
                        1 for t in self.usage_tracking.values() if t.success
                    ) / len(self.usage_tracking) if self.usage_tracking else 0
                }
                
            return analytics
            
        # Advanced Tools
        @self.mcp.tool
        async def expert_find_combinations(
            requirements: Annotated[List[str], Field(
                description="List of required technologies/skills"
            )],
            team_size: Annotated[int, Field(
                description="Size of expert team",
                ge=2,
                le=4
            )] = 2,
            limit: Annotated[int, Field(
                description="Maximum number of teams to return",
                ge=1,
                le=10
            )] = 3
        ) -> List[Dict[str, Any]]:
            """Find complementary expert combinations using graph analysis."""
            teams = await self.hybrid_discovery.find_expert_team(
                requirements=requirements,
                team_size=team_size,
                limit=limit
            )
            
            return [
                {
                    "experts": [e.model_dump() for e in team["experts"]],
                    "coverage_score": team["coverage_score"],
                    "synergy_score": team["synergy_score"],
                    "team_size": team["team_size"],
                    "metadata": team["metadata"]
                }
                for team in teams
            ]
            
        # Vector Search Tools
        @self.mcp.tool
        async def expert_semantic_search(
            query: Annotated[str, Field(description="Natural language description of the task")],
            search_mode: Annotated[str, Field(
                description="Search mode: description, patterns, constraints, or hybrid",
                enum=["description", "patterns", "constraints", "hybrid"]
            )] = "hybrid",
            limit: Annotated[int, Field(description="Maximum number of results", ge=1, le=20)] = 5
        ) -> List[Dict[str, Any]]:
            """Search experts using semantic similarity."""
            results = await self.vector_db.search_experts(
                query=query,
                search_mode=search_mode,
                limit=limit
            )
            
            # Load expert objects and format results
            formatted_results = []
            for expert_id, score, metadata in results:
                expert = await self.registry_manager.get_expert(expert_id)
                if expert:
                    formatted_results.append({
                        "expert": expert.model_dump(),
                        "similarity_score": score,
                        "metadata": metadata
                    })
                    
            return formatted_results
            
        @self.mcp.tool
        async def expert_find_similar(
            expert_id: Annotated[str, Field(description="Expert ID to find similar experts for")],
            similarity_type: Annotated[str, Field(
                description="Type of similarity: overall, domain, technology, or patterns",
                enum=["overall", "domain", "technology", "patterns"]
            )] = "overall",
            limit: Annotated[int, Field(description="Maximum number of results", ge=1, le=10)] = 3
        ) -> List[Dict[str, Any]]:
            """Find experts similar to a given expert."""
            similar = await self.vector_db.find_similar_experts(
                expert_id=expert_id,
                similarity_type=similarity_type,
                limit=limit
            )
            
            results = []
            for similar_id, similarity_score in similar:
                expert = await self.registry_manager.get_expert(similar_id)
                if expert:
                    results.append({
                        "expert": expert.model_dump(),
                        "similarity_score": similarity_score
                    })
                    
            return results
            
        # Graph Query Tools
        @self.mcp.tool
        async def expert_explore_network(
            start_expert_id: Annotated[str, Field(description="Expert ID to start exploration from")],
            depth: Annotated[int, Field(
                description="Depth of exploration",
                ge=1,
                le=4
            )] = 2,
            relationship_types: Annotated[Optional[List[str]], Field(
                description="Types of relationships to explore",
                enum_values=["SPECIALIZES_IN", "COMPATIBLE_WITH", "EVOLVED_FROM", "RELATED_TO"]
            )] = None
        ) -> Dict[str, Any]:
            """Explore expert relationships and networks."""
            network = await self.graph_db.explore_expert_network(
                expert_id=start_expert_id,
                depth=depth,
                relationship_types=relationship_types
            )
            return network
            
        # Hybrid Discovery Tools
        @self.mcp.tool
        async def expert_smart_discover(
            context: Annotated[Dict[str, Any], Field(
                description="Discovery context with description, technologies, constraints, etc."
            )],
            limit: Annotated[int, Field(
                description="Maximum number of results",
                ge=1,
                le=10
            )] = 5
        ) -> List[Dict[str, Any]]:
            """Use AI-powered discovery combining vector and graph search."""
            # Ensure task_type is TaskType enum
            if "task_type" in context and isinstance(context["task_type"], str):
                context["task_type"] = TaskType(context["task_type"])
                
            results = await self.hybrid_discovery.discover(
                context=context,
                limit=limit
            )
            
            formatted_results = []
            for expert, score, metadata in results:
                formatted_results.append({
                    "expert": expert.model_dump(),
                    "score": score.model_dump(),
                    "metadata": metadata,
                    "reasoning": self._generate_discovery_reasoning(expert, score, metadata)
                })
                
            return formatted_results
            
        @self.mcp.tool
        async def expert_get_lineage(
            expert_id: Annotated[str, Field(description="Expert ID to get lineage for")]
        ) -> Dict[str, Any]:
            """Get expert evolution history and relationships."""
            lineage = await self.graph_db.get_expert_lineage(expert_id)
            evolution = await self.hybrid_discovery.explore_expert_evolution(
                expert_id=expert_id,
                include_alternatives=True
            )
            
            return {
                "lineage": lineage,
                "evolution": evolution
            }
            
    def _generate_discovery_reasoning(
        self,
        expert: Expert,
        score: ExpertScore,
        metadata: Dict[str, Any]
    ) -> str:
        """Generate reasoning for expert discovery results."""
        reasons = [
            f"Selected {expert.name} with overall score {score.total_score:.2f}"
        ]
        
        if score.semantic_similarity and score.semantic_similarity > 0:
            reasons.append(f"Semantic match: {score.semantic_similarity:.0%}")
            
        if score.graph_connectivity and score.graph_connectivity > 0:
            tech_matches = metadata.get("tech_matches", 0)
            reasons.append(f"Technology matches: {tech_matches}")
            
        if metadata.get("success_count", 0) > 0:
            reasons.append(f"Previous successes: {metadata['success_count']}")
            
        return " | ".join(reasons)
            
    async def initialize(self):
        """Initialize the server components."""
        await self.registry_manager.initialize()
        
        # Initialize graph database
        await self.graph_db.initialize()
        
        # Set up registry reload callback to sync databases
        self.registry_manager.add_reload_callback(self._sync_databases)
        
        # Initial database sync
        await self._sync_databases()
        
    async def _sync_databases(self):
        """Sync experts to vector and graph databases."""
        logger.info("Syncing databases with registry...")
        
        experts = await self.registry_manager.list_experts(include_metrics=True)
        
        for expert in experts:
            try:
                # Index in vector database
                await self.vector_db.index_expert(expert)
                
                # Index in graph database
                await self.graph_db.index_expert(expert)
                
                # Generate embeddings
                await self.embedding_pipeline.process_expert(expert)
                
            except Exception as e:
                logger.error(f"Failed to sync expert {expert.id}: {e}")
                
        logger.info(f"Synced {len(experts)} experts to databases")
        
    async def cleanup(self):
        """Clean up server resources."""
        await self.registry_manager.cleanup()
        await self.graph_db.close()
        

def run_server(transport: str = "stdio", host: str = "0.0.0.0", port: int = 8000):
    """Run the MCP server with specified transport.
    
    Args:
        transport: Transport type - "stdio" or "sse"
        host: Host to bind to (for SSE transport)
        port: Port to bind to (for SSE transport)
    """
    server = ExpertRegistryServer()
    
    # Run initialization
    asyncio.run(server.initialize())
    
    # Run the server with specified transport
    if transport == "sse":
        server.mcp.run(transport="sse", host=host, port=port)
    else:
        server.mcp.run()


def main():
    """Main entry point for the MCP server."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Expert Registry MCP Server")
    parser.add_argument(
        "--transport", 
        choices=["stdio", "sse"], 
        default="stdio",
        help="Transport type (default: stdio)"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind to for SSE transport (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to for SSE transport (default: 8000)"
    )
    
    args = parser.parse_args()
    
    if args.transport == "sse":
        print(f"Starting Expert Registry MCP Server with SSE transport on {args.host}:{args.port}")
    
    run_server(transport=args.transport, host=args.host, port=args.port)


if __name__ == "__main__":
    main()