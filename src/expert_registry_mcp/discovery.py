"""Hybrid discovery algorithms combining vector and graph search."""

import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from collections import defaultdict

from cachetools import TTLCache
import numpy as np

from .models import Expert, ExpertScore, TaskType
from .registry import RegistryManager
from .vector_db import VectorDatabaseManager
from .graph_db import GraphDatabaseManager
from .embeddings import EmbeddingPipeline

logger = logging.getLogger(__name__)


class HybridDiscovery:
    """Hybrid expert discovery combining vector similarity and graph relationships."""
    
    # Scoring weights for different components
    DEFAULT_WEIGHTS = {
        "semantic_similarity": 0.35,
        "graph_connectivity": 0.25,
        "technology_match": 0.20,
        "performance_history": 0.20
    }
    
    def __init__(
        self,
        registry_manager: RegistryManager,
        vector_db: VectorDatabaseManager,
        graph_db: GraphDatabaseManager,
        embedding_pipeline: EmbeddingPipeline,
        cache_ttl: int = 300
    ):
        self.registry = registry_manager
        self.vector_db = vector_db
        self.graph_db = graph_db
        self.embeddings = embedding_pipeline
        
        # Cache for discovery results
        self.cache = TTLCache(maxsize=200, ttl=cache_ttl)
        
        # Scoring weights (can be customized)
        self.weights = self.DEFAULT_WEIGHTS.copy()
        
    async def discover(
        self,
        context: Dict[str, Any],
        limit: int = 5
    ) -> List[Tuple[Expert, ExpertScore, Dict[str, Any]]]:
        """Discover experts using hybrid search.
        
        Args:
            context: Discovery context containing:
                - description: Task description
                - technologies: List of technologies
                - constraints: List of constraints
                - task_type: Type of task
                - preferred_strategy: single/team/evolutionary
            limit: Maximum number of results
            
        Returns:
            List of (Expert, Score, Metadata) tuples
        """
        cache_key = self._get_cache_key(context, limit)
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        # Extract context
        description = context.get("description", "")
        technologies = context.get("technologies", [])
        task_type = context.get("task_type", TaskType.GENERAL)
        
        # Parallel discovery
        semantic_results, graph_results = await self._parallel_discovery(
            description, technologies, task_type, limit
        )
        
        # Merge and score results
        final_results = await self._merge_and_score(
            semantic_results, graph_results, context, limit
        )
        
        # Apply collaborative filtering if we have history
        enhanced_results = await self._apply_collaborative_filtering(
            final_results, context
        )
        
        # Cache results
        self.cache[cache_key] = enhanced_results
        
        return enhanced_results
        
    async def _parallel_discovery(
        self,
        description: str,
        technologies: List[str],
        task_type: TaskType,
        limit: int
    ) -> Tuple[List[Tuple[str, float, Dict]], List[Tuple[str, Dict]]]:
        """Run vector and graph discovery in parallel."""
        # Vector search with enhanced task embedding
        task_context = {
            "technologies": technologies,
            "task_type": task_type.value
        }
        
        # Get semantic results
        semantic_results = await self.vector_db.search_experts(
            query=description,
            search_mode="hybrid",
            limit=limit * 2  # Get more for better merging
        )
        
        # Get graph results
        graph_results = await self.graph_db.find_expert_by_technologies(
            technologies=technologies,
            task_type=task_type.value,
            limit=limit * 2
        )
        
        return semantic_results, graph_results
        
    async def _merge_and_score(
        self,
        semantic_results: List[Tuple[str, float, Dict]],
        graph_results: List[Tuple[str, Dict]],
        context: Dict[str, Any],
        limit: int
    ) -> List[Tuple[Expert, ExpertScore, Dict[str, Any]]]:
        """Merge results from different sources and calculate final scores."""
        # Collect all unique expert IDs
        expert_scores = defaultdict(lambda: {
            "semantic": 0.0,
            "graph": 0.0,
            "metadata": {}
        })
        
        # Process semantic results
        max_semantic = max([s[1] for s in semantic_results], default=1.0)
        for expert_id, score, metadata in semantic_results:
            normalized_score = score / max_semantic if max_semantic > 0 else 0
            expert_scores[expert_id]["semantic"] = normalized_score
            expert_scores[expert_id]["metadata"].update(metadata)
            
        # Process graph results
        for expert_id, graph_data in graph_results:
            # Normalize graph scores
            coverage = graph_data.get("coverage", 0)
            success_factor = min(graph_data.get("success_count", 0) / 10, 1.0)
            graph_score = (coverage * 0.7) + (success_factor * 0.3)
            
            expert_scores[expert_id]["graph"] = graph_score
            expert_scores[expert_id]["metadata"].update(graph_data)
            
        # Load expert objects and calculate final scores
        final_results = []
        
        for expert_id, scores in expert_scores.items():
            expert = await self.registry.get_expert(expert_id)
            if not expert:
                continue
                
            # Calculate technology match score
            tech_score = await self._calculate_technology_match(
                expert, context.get("technologies", [])
            )
            
            # Get performance score
            perf_score = self._calculate_performance_score(expert)
            
            # Create expert score
            expert_score = ExpertScore(
                expert_id=expert_id,
                semantic_similarity=scores["semantic"],
                graph_connectivity=scores["graph"],
                technology_match=tech_score,
                performance_history=perf_score,
                workflow_compatibility=expert.workflow_compatibility.get(
                    context.get("task_type", TaskType.GENERAL).value, 0.5
                ),
                capability_assessment=0.8  # Default high capability
            )
            
            # Calculate weighted total
            expert_score.total_score = (
                expert_score.semantic_similarity * self.weights["semantic_similarity"] +
                expert_score.graph_connectivity * self.weights["graph_connectivity"] +
                expert_score.technology_match * self.weights["technology_match"] +
                expert_score.performance_history * self.weights["performance_history"]
            )
            
            final_results.append((expert, expert_score, scores["metadata"]))
            
        # Sort by total score
        final_results.sort(key=lambda x: x[1].total_score, reverse=True)
        
        return final_results[:limit]
        
    async def _calculate_technology_match(
        self,
        expert: Expert,
        required_technologies: List[str]
    ) -> float:
        """Calculate technology match score."""
        if not required_technologies:
            return 0.5
            
        matches = 0
        for tech in required_technologies:
            tech_lower = tech.lower()
            for spec in expert.specializations:
                if tech_lower in spec.technology.lower():
                    matches += 1
                    break
                for framework in spec.frameworks:
                    if tech_lower in framework.lower():
                        matches += 0.5
                        break
                        
        return min(matches / len(required_technologies), 1.0)
        
    def _calculate_performance_score(self, expert: Expert) -> float:
        """Calculate performance history score."""
        if not expert.performance_metrics:
            return 0.5  # Neutral score for new experts
            
        metrics = expert.performance_metrics
        
        if metrics.total_applications == 0:
            return 0.5
            
        # Success rate
        success_rate = metrics.successful_applications / metrics.total_applications
        
        # Adherence score (normalized to 0-1)
        adherence_normalized = metrics.average_adherence_score / 10.0
        
        # Combine with more weight on success rate
        return (success_rate * 0.7) + (adherence_normalized * 0.3)
        
    async def _apply_collaborative_filtering(
        self,
        results: List[Tuple[Expert, ExpertScore, Dict]],
        context: Dict[str, Any]
    ) -> List[Tuple[Expert, ExpertScore, Dict]]:
        """Apply collaborative filtering based on task history."""
        # For now, return results as-is
        # In production, this would analyze similar past tasks
        # and boost experts that succeeded in similar contexts
        return results
        
    async def find_expert_team(
        self,
        requirements: List[str],
        team_size: int = 2,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Find complementary expert teams."""
        # Get combinations from graph database
        graph_combinations = await self.graph_db.find_expert_combinations(
            technologies=requirements,
            team_size=team_size,
            limit=limit * 2
        )
        
        # Enhance with semantic analysis
        enhanced_teams = []
        
        for expert_ids, coverage, metadata in graph_combinations:
            # Load expert objects
            experts = []
            for expert_id in expert_ids:
                expert = await self.registry.get_expert(expert_id)
                if expert:
                    experts.append(expert)
                    
            if len(experts) != team_size:
                continue
                
            # Calculate team synergy
            synergy = await self._calculate_team_synergy(experts, requirements)
            
            team_info = {
                "experts": experts,
                "coverage_score": coverage,
                "synergy_score": synergy,
                "team_size": len(experts),
                "metadata": metadata
            }
            
            enhanced_teams.append(team_info)
            
        # Sort by combined score
        enhanced_teams.sort(
            key=lambda x: (x["coverage_score"] * 0.6) + (x["synergy_score"] * 0.4),
            reverse=True
        )
        
        return enhanced_teams[:limit]
        
    async def _calculate_team_synergy(
        self,
        experts: List[Expert],
        requirements: List[str]
    ) -> float:
        """Calculate synergy score for a team of experts."""
        # Check for complementary skills
        all_techs = set()
        overlap_count = 0
        
        for expert in experts:
            expert_techs = set()
            for spec in expert.specializations:
                expert_techs.add(spec.technology.lower())
                
            # Count overlaps
            overlap_count += len(all_techs.intersection(expert_techs))
            all_techs.update(expert_techs)
            
        # Good synergy = high coverage, low overlap
        coverage = len([r for r in requirements if any(
            r.lower() in tech for tech in all_techs
        )]) / len(requirements) if requirements else 0
        
        # Normalize overlap (less overlap is better)
        max_overlap = len(experts) * len(all_techs) / 2
        overlap_score = 1 - (overlap_count / max_overlap) if max_overlap > 0 else 1
        
        return (coverage * 0.7) + (overlap_score * 0.3)
        
    async def explore_expert_evolution(
        self,
        expert_id: str,
        include_alternatives: bool = True
    ) -> Dict[str, Any]:
        """Explore expert evolution and alternatives."""
        # Get lineage from graph
        lineage = await self.graph_db.get_expert_lineage(expert_id)
        
        # Get similar experts from vector search
        alternatives = []
        if include_alternatives:
            similar = await self.vector_db.find_similar_experts(
                expert_id=expert_id,
                similarity_type="overall",
                limit=5
            )
            
            for alt_id, similarity in similar:
                if alt_id != expert_id:
                    alt_expert = await self.registry.get_expert(alt_id)
                    if alt_expert:
                        alternatives.append({
                            "expert": alt_expert,
                            "similarity": similarity
                        })
                        
        return {
            "lineage": lineage,
            "alternatives": alternatives
        }
        
    def _get_cache_key(self, context: Dict[str, Any], limit: int) -> str:
        """Generate cache key for discovery context."""
        # Create a stable key from context
        key_parts = [
            context.get("description", ""),
            ":".join(sorted(context.get("technologies", []))),
            context.get("task_type", "general"),
            str(limit)
        ]
        return "|".join(key_parts)
        
    def update_weights(self, new_weights: Dict[str, float]):
        """Update scoring weights."""
        # Validate weights sum to approximately 1
        total = sum(new_weights.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights must sum to 1.0, got {total}")
            
        self.weights.update(new_weights)
        self.cache.clear()  # Clear cache when weights change
        
    def get_discovery_stats(self) -> Dict[str, Any]:
        """Get statistics about discovery operations."""
        return {
            "cache_size": len(self.cache),
            "weights": self.weights,
            "cache_ttl": self.cache.ttl
        }