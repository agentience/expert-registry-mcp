"""Expert selection engine with technology detection and scoring."""

import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from cachetools import TTLCache
import aiofiles

from .models import (
    Expert, TechnologyDetectionResult, ExpertScore,
    ExpertSelectionResult, TaskType
)
from .registry import RegistryManager


class SelectionEngine:
    """Engine for technology detection and expert selection."""
    
    # Scoring weights
    WEIGHTS = {
        "technology_match": 0.35,
        "workflow_compatibility": 0.30,
        "performance_history": 0.25,
        "capability_assessment": 0.10
    }
    
    def __init__(self, registry_manager: RegistryManager, cache_ttl: int = 300):
        self.registry_manager = registry_manager
        self.cache = TTLCache(maxsize=100, ttl=cache_ttl)
        
    async def detect_technologies(
        self,
        scan_paths: List[str],
        include_content: bool = False
    ) -> TechnologyDetectionResult:
        """Detect technologies from file paths and optionally content."""
        cache_key = f"tech:{':'.join(scan_paths)}:{include_content}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        technologies = set()
        frameworks = set()
        
        for scan_path in scan_paths:
            path = Path(scan_path)
            
            # Check package.json
            if path.name == "package.json" and path.exists():
                await self._detect_from_package_json(path, technologies, frameworks)
            
            # Check requirements.txt
            elif path.name == "requirements.txt" and path.exists():
                await self._detect_from_requirements(path, technologies, frameworks)
                
            # Check directory
            elif path.is_dir() and path.exists():
                await self._detect_from_directory(path, technologies, frameworks)
                
        result = TechnologyDetectionResult(
            technologies=sorted(list(technologies)),
            frameworks=sorted(list(frameworks)),
            confidence=0.8 if technologies else 0.3
        )
        
        self.cache[cache_key] = result
        return result
        
    async def _detect_from_package_json(
        self,
        path: Path,
        technologies: set,
        frameworks: set
    ):
        """Detect from package.json file."""
        try:
            async with aiofiles.open(path, 'r') as f:
                content = await f.read()
                data = json.loads(content)
                
            deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
            
            # AWS technologies
            if '@aws-amplify/backend' in deps:
                technologies.add('AWS Amplify Gen 2')
                frameworks.add('AWS Amplify')
            if '@cloudscape-design/components' in deps:
                technologies.add('AWS Cloudscape')
                frameworks.add('Cloudscape Design System')
            if '@aws-sdk/client-dynamodb' in deps:
                technologies.add('AWS DynamoDB')
                frameworks.add('AWS SDK')
                
            # Frontend frameworks
            if 'react' in deps:
                technologies.add('React')
                frameworks.add('React')
            if 'vue' in deps:
                technologies.add('Vue.js')
                frameworks.add('Vue')
            if '@angular/core' in deps:
                technologies.add('Angular')
                frameworks.add('Angular')
                
            # Backend frameworks
            if 'express' in deps:
                technologies.add('Express.js')
                frameworks.add('Express')
            if 'fastify' in deps:
                technologies.add('Fastify')
                frameworks.add('Fastify')
                
        except Exception:
            pass
            
    async def _detect_from_requirements(
        self,
        path: Path,
        technologies: set,
        frameworks: set
    ):
        """Detect from requirements.txt file."""
        try:
            async with aiofiles.open(path, 'r') as f:
                content = await f.read()
                
            lines = content.lower().split('\n')
            
            # Python frameworks
            if any('django' in line for line in lines):
                technologies.add('Django')
                frameworks.add('Django')
            if any('flask' in line for line in lines):
                technologies.add('Flask')
                frameworks.add('Flask')
            if any('fastapi' in line for line in lines):
                technologies.add('FastAPI')
                frameworks.add('FastAPI')
            if any('boto3' in line for line in lines):
                technologies.add('AWS SDK Python')
                frameworks.add('Boto3')
                
        except Exception:
            pass
            
    async def _detect_from_directory(
        self,
        path: Path,
        technologies: set,
        frameworks: set
    ):
        """Detect from directory structure."""
        try:
            entries = list(path.iterdir())
            
            # Check file extensions
            extensions = {f.suffix for f in entries if f.is_file()}
            
            if '.tsx' in extensions or '.jsx' in extensions:
                technologies.add('React')
            if '.vue' in extensions:
                technologies.add('Vue.js')
            if '.py' in extensions:
                technologies.add('Python')
            if '.ts' in extensions or '.js' in extensions:
                technologies.add('TypeScript/JavaScript')
                
            # Check for specific files/folders
            names = {f.name for f in entries}
            
            if 'amplify' in names or 'amplify.yml' in names:
                technologies.add('AWS Amplify')
            if 'serverless.yml' in names:
                technologies.add('Serverless Framework')
            if 'docker-compose.yml' in names:
                technologies.add('Docker')
                
        except Exception:
            pass
            
    async def select_optimal_expert(
        self,
        task_description: str,
        technologies: Optional[List[str]] = None,
        task_type: Optional[TaskType] = None,
        strategy: str = "single"
    ) -> ExpertSelectionResult:
        """Select the best expert for a task."""
        # Get all experts
        experts = await self.registry_manager.list_experts(include_metrics=True)
        
        # Score each expert
        scores = []
        for expert in experts:
            score = await self._score_expert(
                expert,
                task_description,
                technologies or [],
                task_type or TaskType.GENERAL
            )
            scores.append((expert, score))
            
        # Sort by total score
        scores.sort(key=lambda x: x[1].total_score, reverse=True)
        
        if not scores:
            raise ValueError("No experts available")
            
        # Select based on strategy
        winner_expert, winner_score = scores[0]
        
        return ExpertSelectionResult(
            expert=winner_expert,
            score=winner_score,
            reasoning=self._generate_reasoning(winner_expert, winner_score),
            alternatives=[score for _, score in scores[1:4]],  # Top 3 alternatives
            selection_strategy=strategy
        )
        
    async def _score_expert(
        self,
        expert: Expert,
        task_description: str,
        technologies: List[str],
        task_type: TaskType
    ) -> ExpertScore:
        """Score an expert for a specific task."""
        score = ExpertScore(expert_id=expert.id)
        
        # Technology match (35%)
        if technologies:
            tech_matches = sum(
                1 for tech in technologies
                if any(
                    tech.lower() in spec.technology.lower()
                    for spec in expert.specializations
                )
            )
            score.technology_match = (tech_matches / len(technologies)) * self.WEIGHTS["technology_match"]
        else:
            score.technology_match = 0.5 * self.WEIGHTS["technology_match"]
            
        # Workflow compatibility (30%)
        workflow_score = expert.workflow_compatibility.get(task_type.value, 0.5)
        score.workflow_compatibility = workflow_score * self.WEIGHTS["workflow_compatibility"]
        
        # Performance history (25%)
        if expert.performance_metrics:
            if expert.performance_metrics.total_applications > 0:
                success_rate = (
                    expert.performance_metrics.successful_applications /
                    expert.performance_metrics.total_applications
                )
                score.performance_history = success_rate * self.WEIGHTS["performance_history"]
            else:
                score.performance_history = 0.5 * self.WEIGHTS["performance_history"]
        else:
            score.performance_history = 0.5 * self.WEIGHTS["performance_history"]
            
        # Capability assessment (10%)
        # For now, default high capability
        score.capability_assessment = 0.8 * self.WEIGHTS["capability_assessment"]
        
        # Calculate total
        score.total_score = (
            score.technology_match +
            score.workflow_compatibility +
            score.performance_history +
            score.capability_assessment
        )
        
        return score
        
    def _generate_reasoning(self, expert: Expert, score: ExpertScore) -> str:
        """Generate human-readable reasoning for selection."""
        reasons = [
            f"Selected {expert.name} (score: {score.total_score:.2f})",
            f"Technology match: {score.technology_match/self.WEIGHTS['technology_match']:.0%}",
            f"Workflow compatibility: {score.workflow_compatibility/self.WEIGHTS['workflow_compatibility']:.0%}"
        ]
        
        if expert.performance_metrics and expert.performance_metrics.total_applications > 0:
            success_rate = (
                expert.performance_metrics.successful_applications /
                expert.performance_metrics.total_applications
            )
            reasons.append(f"Success rate: {success_rate:.0%} from {expert.performance_metrics.total_applications} applications")
            
        return " | ".join(reasons)
        
    async def assess_capability(
        self,
        expert_id: str,
        task_description: str,
        constraints: Optional[Dict] = None
    ) -> float:
        """Assess expert capability for a specific task."""
        # For now, return a high default score
        # In production, this could query an LLM or use more sophisticated analysis
        return 0.85
        
    async def find_expert_combinations(
        self,
        requirements: List[str],
        team_size: int = 2
    ) -> List[Tuple[List[Expert], float]]:
        """Find complementary expert combinations."""
        experts = await self.registry_manager.list_experts()
        
        # Simple implementation: find experts that together cover all requirements
        combinations = []
        
        # This is a simplified version - in production you'd want more sophisticated
        # combination algorithms
        for i, expert1 in enumerate(experts):
            for expert2 in experts[i+1:]:
                if team_size == 2:
                    coverage = self._calculate_coverage([expert1, expert2], requirements)
                    if coverage > 0.8:
                        combinations.append(([expert1, expert2], coverage))
                        
        combinations.sort(key=lambda x: x[1], reverse=True)
        return combinations[:3]
        
    def _calculate_coverage(self, experts: List[Expert], requirements: List[str]) -> float:
        """Calculate how well a team of experts covers requirements."""
        covered = set()
        
        for expert in experts:
            for spec in expert.specializations:
                for req in requirements:
                    if req.lower() in spec.technology.lower():
                        covered.add(req)
                        
        return len(covered) / len(requirements) if requirements else 0.0