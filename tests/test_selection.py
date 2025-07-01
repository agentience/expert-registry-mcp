"""Tests for expert selection engine."""

import pytest
import pytest_asyncio
import tempfile
import json
from pathlib import Path
from datetime import datetime

from expert_registry_mcp.models import TaskType, TechnologyDetectionResult, Expert, ExpertSpecialization
from expert_registry_mcp.selection import SelectionEngine
from expert_registry_mcp.registry import RegistryManager


@pytest_asyncio.fixture
async def registry_manager():
    """Create a registry manager with test data."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test registry
        registry_path = Path(tmpdir) / "expert-registry.json"
        
        test_registry = {
            "version": "1.0.0",
            "last_updated": datetime.now().isoformat(),
            "experts": [
                {
                    "id": "test-expert-1",
                    "name": "Test Expert 1",
                    "version": "1.0.0",
                    "description": "Test expert for AWS",
                    "domains": ["cloud", "backend"],
                    "specializations": [
                        {
                            "technology": "AWS Amplify",
                            "frameworks": ["CDK", "CLI"],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.9,
                        "bug-fix": 0.8
                    },
                    "constraints": ["Use best practices"],
                    "patterns": ["Infrastructure as Code"]
                },
                {
                    "id": "test-expert-2",
                    "name": "Test Expert 2",
                    "version": "1.0.0", 
                    "description": "Test expert for React",
                    "domains": ["frontend", "ui"],
                    "specializations": [
                        {
                            "technology": "React",
                            "frameworks": ["Next.js", "Vite"],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "refactoring": 0.95,
                        "feature": 0.8
                    },
                    "constraints": ["Use modern React patterns"],
                    "patterns": ["Component composition"]
                }
            ]
        }
        
        with open(registry_path, 'w') as f:
            json.dump(test_registry, f, indent=2)
        
        manager = RegistryManager(registry_path)
        await manager.initialize()
        
        yield manager
        
        await manager.cleanup()


@pytest.mark.asyncio
async def test_technology_detection(registry_manager, tmp_path):
    """Test technology detection from files."""
    engine = SelectionEngine(registry_manager)
    
    # Create test package.json
    package_json = tmp_path / "package.json"
    package_json.write_text("""{
        "dependencies": {
            "@aws-amplify/backend": "^1.0.0",
            "react": "^18.0.0"
        }
    }""")
    
    # Detect technologies
    result = await engine.detect_technologies([str(package_json)])
    
    assert "AWS Amplify Gen 2" in result.technologies
    assert "React" in result.technologies
    assert "AWS Amplify" in result.frameworks
    assert result.confidence > 0.5


@pytest.mark.asyncio
async def test_expert_selection(registry_manager):
    """Test optimal expert selection."""
    engine = SelectionEngine(registry_manager)
    
    # Select for AWS task
    result = await engine.select_optimal_expert(
        task_description="Build serverless backend with AWS",
        technologies=["AWS Amplify"],
        task_type=TaskType.FEATURE
    )
    
    assert result.expert.id == "test-expert-1"
    assert result.score.total_score > 0
    assert result.reasoning is not None
    assert len(result.alternatives) <= 3
    
    # Select for React task
    result = await engine.select_optimal_expert(
        task_description="Refactor React components",
        technologies=["React"],
        task_type=TaskType.REFACTORING
    )
    
    assert result.expert.id == "test-expert-2"


@pytest.mark.asyncio
async def test_expert_scoring(registry_manager):
    """Test expert scoring calculation."""
    engine = SelectionEngine(registry_manager)
    
    # Get test expert
    expert = await registry_manager.get_expert("test-expert-1")
    
    # Score for matching task
    score = await engine._score_expert(
        expert,
        "AWS task",
        ["AWS Amplify"],
        TaskType.FEATURE
    )
    
    assert score.technology_match > 0
    assert score.workflow_compatibility > 0
    assert score.total_score > 0.5
    
    # Score for non-matching task
    score = await engine._score_expert(
        expert,
        "Python task",
        ["Django"],
        TaskType.ARTICLE
    )
    
    assert score.technology_match == 0
    assert score.total_score < 0.5


@pytest.mark.asyncio
async def test_capability_assessment(registry_manager):
    """Test expert capability assessment."""
    engine = SelectionEngine(registry_manager)
    
    # Assess capability
    capability = await engine.assess_capability(
        "test-expert-1",
        "Build AWS serverless API",
        {"performance": "high", "security": "critical"}
    )
    
    assert 0 <= capability <= 1.0
    assert capability > 0.5  # Should be capable


@pytest.mark.asyncio
async def test_find_combinations(registry_manager):
    """Test finding expert combinations."""
    engine = SelectionEngine(registry_manager)
    
    # Find team for full-stack requirements
    combinations = await engine.find_expert_combinations(
        requirements=["AWS Amplify", "React"],
        team_size=2
    )
    
    assert len(combinations) > 0
    experts, coverage = combinations[0]
    assert len(experts) == 2
    assert coverage > 0.8
    
    # Should include both test experts
    expert_ids = {e.id for e in experts}
    assert "test-expert-1" in expert_ids
    assert "test-expert-2" in expert_ids