"""Tests for registry management."""

import pytest
import pytest_asyncio
import json
import tempfile
from pathlib import Path
from datetime import datetime

from expert_registry_mcp.models import Expert, ExpertRegistry, ExpertSpecialization
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
                            "frameworks": ["CDK"],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.9,
                        "bug-fix": 0.8
                    }
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
                            "frameworks": ["Next.js"],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.95,
                        "refactoring": 0.85
                    }
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
async def test_list_experts(registry_manager):
    """Test listing experts."""
    # List all experts
    experts = await registry_manager.list_experts()
    assert len(experts) == 2
    assert experts[0].id == "test-expert-1"
    assert experts[1].id == "test-expert-2"
    
    # Filter by domain
    cloud_experts = await registry_manager.list_experts(domain="cloud")
    assert len(cloud_experts) == 1
    assert cloud_experts[0].id == "test-expert-1"
    
    # Filter by technology
    react_experts = await registry_manager.list_experts(technology="React")
    assert len(react_experts) == 1
    assert react_experts[0].id == "test-expert-2"


@pytest.mark.asyncio
async def test_get_expert(registry_manager):
    """Test getting specific expert."""
    # Get existing expert
    expert = await registry_manager.get_expert("test-expert-1")
    assert expert is not None
    assert expert.id == "test-expert-1"
    assert expert.name == "Test Expert 1"
    
    # Get non-existent expert
    expert = await registry_manager.get_expert("non-existent")
    assert expert is None


@pytest.mark.asyncio
async def test_search_experts(registry_manager):
    """Test searching experts."""
    # Search by name
    results = await registry_manager.search_experts("Test Expert 1")
    assert len(results) == 1
    assert results[0].id == "test-expert-1"
    
    # Search by technology
    results = await registry_manager.search_experts("aws", ["technologies"])
    assert len(results) == 1
    assert results[0].id == "test-expert-1"
    
    # Search with no results
    results = await registry_manager.search_experts("Python")
    assert len(results) == 0


@pytest.mark.asyncio
async def test_caching(registry_manager):
    """Test that caching works correctly."""
    # First call should hit the file
    experts1 = await registry_manager.list_experts()
    
    # Second call should hit cache
    experts2 = await registry_manager.list_experts()
    
    # Results should be identical
    assert len(experts1) == len(experts2)
    assert experts1[0].id == experts2[0].id