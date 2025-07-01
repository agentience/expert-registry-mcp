"""Tests for expert selection scenarios with vector and graph database integration."""

import pytest
import pytest_asyncio
import asyncio
from pathlib import Path
import tempfile
import json
from datetime import datetime

from expert_registry_mcp.models import Expert, ExpertRegistry, TaskType
from expert_registry_mcp.registry import RegistryManager
from expert_registry_mcp.vector_db import VectorDatabaseManager
from expert_registry_mcp.graph_db import GraphDatabaseManager
from expert_registry_mcp.embeddings import EmbeddingPipeline
from expert_registry_mcp.discovery import HybridDiscovery


@pytest_asyncio.fixture
async def test_environment():
    """Create a test environment with the three experts."""
    with tempfile.TemporaryDirectory() as tmpdir:
        base_path = Path(tmpdir)
        registry_path = base_path / "registry" / "expert-registry.json"
        registry_path.parent.mkdir(parents=True)
        
        # Create test registry with our three experts
        test_registry = {
            "version": "1.0.0",
            "last_updated": datetime.now().isoformat(),
            "experts": [
                {
                    "id": "amplify",
                    "name": "AWS Amplify Gen 2 Expert",
                    "version": "1.0.0",
                    "description": "Expert in AWS Amplify Gen 2 development, specializing in serverless backend infrastructure, authentication, and real-time data synchronization",
                    "domains": ["backend", "cloud", "serverless", "aws"],
                    "specializations": [
                        {
                            "technology": "AWS Amplify Gen 2",
                            "frameworks": ["AWS CDK", "TypeScript", "React"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "AWS Lambda",
                            "frameworks": ["Node.js", "Python"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "DynamoDB",
                            "frameworks": ["AWS SDK"],
                            "expertise_level": "advanced"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.95,
                        "bug-fix": 0.85,
                        "refactoring": 0.80,
                        "investigation": 0.70,
                        "article": 0.60
                    },
                    "constraints": [
                        "Use TypeScript-first approach",
                        "Follow AWS Well-Architected Framework"
                    ],
                    "patterns": [
                        "Infrastructure as Code with CDK",
                        "Serverless-first architecture"
                    ]
                },
                {
                    "id": "cloudscape",
                    "name": "AWS Cloudscape Design System Expert",
                    "version": "1.0.0",
                    "description": "Expert in AWS Cloudscape Design System for building cloud management interfaces and enterprise applications",
                    "domains": ["frontend", "ui", "design-system", "aws"],
                    "specializations": [
                        {
                            "technology": "AWS Cloudscape",
                            "frameworks": ["React", "TypeScript"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "React",
                            "frameworks": ["Next.js", "Vite"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "TypeScript",
                            "frameworks": [],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.90,
                        "bug-fix": 0.95,
                        "refactoring": 0.85,
                        "investigation": 0.75,
                        "article": 0.70
                    },
                    "constraints": [
                        "Follow Cloudscape design guidelines",
                        "Ensure WCAG 2.1 AA accessibility compliance"
                    ],
                    "patterns": [
                        "Component composition patterns",
                        "Form validation with Cloudscape"
                    ]
                },
                {
                    "id": "dynamodb",
                    "name": "AWS DynamoDB Expert",
                    "version": "1.0.0",
                    "description": "Expert in AWS DynamoDB NoSQL database design, specializing in single-table design patterns, performance optimization, and data modeling for serverless applications",
                    "domains": ["database", "backend", "aws", "nosql"],
                    "specializations": [
                        {
                            "technology": "AWS DynamoDB",
                            "frameworks": ["AWS SDK", "DynamoDB Toolbox", "Dynamoose"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "NoSQL",
                            "frameworks": ["Single-Table Design", "Data Modeling"],
                            "expertise_level": "expert"
                        },
                        {
                            "technology": "AWS Lambda",
                            "frameworks": ["Node.js", "Python"],
                            "expertise_level": "advanced"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.88,
                        "bug-fix": 0.92,
                        "refactoring": 0.85,
                        "investigation": 0.95,
                        "article": 0.80
                    },
                    "constraints": [
                        "Follow single-table design patterns",
                        "Optimize for query patterns, not storage"
                    ],
                    "patterns": [
                        "Single-table design pattern",
                        "GSI overloading pattern"
                    ]
                }
            ]
        }
        
        with open(registry_path, 'w') as f:
            json.dump(test_registry, f, indent=2)
        
        # Initialize components
        registry_manager = RegistryManager(registry_path)
        await registry_manager.initialize()
        
        vector_db = VectorDatabaseManager(
            persist_path=base_path / "vector-db",
            embedding_model="all-MiniLM-L6-v2"
        )
        
        # Mock graph database for testing (to avoid Neo4j dependency)
        class MockGraphDB:
            async def initialize(self):
                pass
                
            async def index_expert(self, expert):
                return True
                
            async def find_expert_by_technologies(self, technologies, task_type, limit):
                # Simple mock implementation
                results = []
                if "DynamoDB" in technologies:
                    results.append(("dynamodb", {"coverage": 1.0, "success_count": 5}))
                if "AWS Cloudscape" in technologies:
                    results.append(("cloudscape", {"coverage": 1.0, "success_count": 3}))
                if "AWS Amplify" in technologies:
                    results.append(("amplify", {"coverage": 1.0, "success_count": 4}))
                return results[:limit]
                
            async def find_expert_combinations(self, technologies, team_size, limit=5):
                # Mock team formation
                experts = await registry_manager.list_experts()
                
                # Simple mock: return tuples of (expert_ids, coverage, metadata)
                combinations = []
                if len(experts) >= 2:
                    expert_ids = [e.id for e in experts[:team_size]]
                    combinations.append((expert_ids, 0.85, {"reason": "mock team"}))
                return combinations[:limit]
                
            async def close(self):
                pass
        
        graph_db = MockGraphDB()
        await graph_db.initialize()
        
        embedding_pipeline = EmbeddingPipeline(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Index experts in vector database
        experts = await registry_manager.list_experts()
        for expert in experts:
            await vector_db.index_expert(expert)
        
        hybrid_discovery = HybridDiscovery(
            registry_manager=registry_manager,
            vector_db=vector_db,
            graph_db=graph_db,
            embedding_pipeline=embedding_pipeline
        )
        
        yield {
            "registry": registry_manager,
            "vector_db": vector_db,
            "graph_db": graph_db,
            "discovery": hybrid_discovery,
            "base_path": base_path
        }
        
        # Cleanup
        await registry_manager.cleanup()
        await graph_db.close()


class TestExpertSelectionScenarios:
    """Test different scenarios to ensure correct expert selection."""
    
    @pytest.mark.asyncio
    async def test_amplify_backend_scenario(self, test_environment):
        """Test that Amplify expert is selected for serverless backend tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario: Building a serverless API with authentication
        context = {
            "description": "Build a serverless REST API with user authentication and real-time data sync",
            "technologies": ["AWS Amplify", "AWS Lambda", "TypeScript"],
            "task_type": TaskType.FEATURE,
            "constraints": ["Must be serverless", "Need real-time updates"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Verify Amplify expert is selected first
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "amplify"
        assert results[0][1].total_score > 0.7  # High confidence
        
    @pytest.mark.asyncio
    async def test_cloudscape_ui_scenario(self, test_environment):
        """Test that Cloudscape expert is selected for UI/frontend tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario: Building an AWS console-like interface
        context = {
            "description": "Create a cloud management dashboard with tables, forms, and data visualization using AWS design patterns",
            "technologies": ["AWS Cloudscape", "React", "TypeScript"],
            "task_type": TaskType.FEATURE,
            "constraints": ["Must follow AWS UI patterns", "Needs accessibility compliance"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Verify Cloudscape expert is selected first
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "cloudscape"
        assert results[0][1].total_score > 0.7
        
    @pytest.mark.asyncio
    async def test_dynamodb_database_scenario(self, test_environment):
        """Test that DynamoDB expert is selected for database design tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario: Designing a scalable NoSQL database
        context = {
            "description": "Design a single-table DynamoDB schema for an e-commerce platform with products, orders, and customers",
            "technologies": ["DynamoDB", "NoSQL"],
            "task_type": TaskType.FEATURE,
            "constraints": ["Must use single-table design", "Optimize for query patterns"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Verify DynamoDB expert is selected first
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "dynamodb"
        assert results[0][1].total_score > 0.7
        
    @pytest.mark.asyncio
    async def test_bug_fix_scenario(self, test_environment):
        """Test expert selection for bug fix tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario 1: UI bug in Cloudscape component
        context = {
            "description": "Fix dropdown component not displaying selected values correctly in data table",
            "technologies": ["AWS Cloudscape", "React"],
            "task_type": TaskType.BUG_FIX,
            "constraints": []
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Cloudscape expert should be selected (high bug-fix compatibility)
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "cloudscape"
        
    @pytest.mark.asyncio
    async def test_investigation_scenario(self, test_environment):
        """Test expert selection for investigation tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario: Investigating DynamoDB performance issues
        context = {
            "description": "Investigate slow query performance and high read costs in DynamoDB table",
            "technologies": ["DynamoDB", "AWS"],
            "task_type": TaskType.INVESTIGATION,
            "constraints": []
        }
        
        results = await discovery.discover(context, limit=3)
        
        # DynamoDB expert should be selected (high investigation compatibility)
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "dynamodb"
        
    @pytest.mark.asyncio
    async def test_mixed_technology_scenario(self, test_environment):
        """Test expert selection when multiple technologies are involved."""
        discovery = test_environment["discovery"]
        
        # Scenario: Full-stack feature with Amplify backend and Cloudscape UI
        context = {
            "description": "Build admin dashboard with Cloudscape components connected to Amplify backend",
            "technologies": ["AWS Amplify", "AWS Cloudscape", "React", "DynamoDB"],
            "task_type": TaskType.FEATURE,
            "constraints": []
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Should get multiple experts ranked by relevance
        assert len(results) >= 2
        expert_ids = [r[0].id for r in results]
        
        # Both Amplify and Cloudscape should be in top results
        assert "amplify" in expert_ids[:2]
        assert "cloudscape" in expert_ids[:2]
        
    @pytest.mark.asyncio
    async def test_refactoring_scenario(self, test_environment):
        """Test expert selection for refactoring tasks."""
        discovery = test_environment["discovery"]
        
        # Scenario: Refactoring Lambda functions
        context = {
            "description": "Refactor Lambda functions to improve performance and reduce cold starts",
            "technologies": ["AWS Lambda", "TypeScript", "AWS Amplify"],
            "task_type": TaskType.REFACTORING,
            "constraints": ["Maintain backward compatibility"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Amplify expert should be selected (Lambda expertise)
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "amplify"
        
    @pytest.mark.asyncio
    async def test_semantic_understanding(self, test_environment):
        """Test that semantic search understands context beyond keywords."""
        discovery = test_environment["discovery"]
        
        # Scenario: Request doesn't explicitly mention technology names
        context = {
            "description": "Create a web interface for managing cloud resources with tables and forms",
            "technologies": [],  # No explicit technologies
            "task_type": TaskType.FEATURE,
            "constraints": ["Follow AWS design patterns"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Should still identify Cloudscape expert through semantic understanding
        assert len(results) > 0
        # Cloudscape expert should be highly ranked
        expert_ids = [r[0].id for r in results[:2]]
        assert "cloudscape" in expert_ids
        
    @pytest.mark.asyncio
    async def test_team_formation_scenario(self, test_environment):
        """Test finding complementary expert teams."""
        discovery = test_environment["discovery"]
        
        # Scenario: Need both backend and frontend expertise
        requirements = ["AWS Amplify", "AWS Cloudscape", "DynamoDB", "React"]
        
        teams = await discovery.find_expert_team(
            requirements=requirements,
            team_size=2,
            limit=3
        )
        
        # Should suggest complementary pairs
        assert len(teams) > 0
        first_team = teams[0]
        assert len(first_team["experts"]) == 2
        assert first_team["coverage_score"] > 0.8
        
        # Team should cover different domains
        expert_ids = {e.id for e in first_team["experts"]}
        # Should pair backend (amplify/dynamodb) with frontend (cloudscape)
        assert len(expert_ids) == 2
        
    @pytest.mark.asyncio
    async def test_no_match_scenario(self, test_environment):
        """Test behavior when no expert matches well."""
        discovery = test_environment["discovery"]
        
        # Scenario: Technology not in our expert pool
        context = {
            "description": "Build a machine learning pipeline with TensorFlow and Kubernetes",
            "technologies": ["TensorFlow", "Kubernetes", "Python"],
            "task_type": TaskType.FEATURE,
            "constraints": []
        }
        
        results = await discovery.discover(context, limit=3)
        
        # Should still return results but with lower scores
        if len(results) > 0:
            # Scores should be lower due to poor match
            assert results[0][1].total_score < 0.5
            
    @pytest.mark.asyncio
    async def test_constraint_matching(self, test_environment):
        """Test that constraints influence expert selection."""
        discovery = test_environment["discovery"]
        
        # Scenario: Specific constraint that matches DynamoDB expert
        context = {
            "description": "Design a database schema for high-volume data",
            "technologies": ["AWS"],
            "task_type": TaskType.FEATURE,
            "constraints": ["Must use single-table design pattern", "Optimize for query patterns"]
        }
        
        results = await discovery.discover(context, limit=3)
        
        # DynamoDB expert should be selected due to constraint match
        assert len(results) > 0
        top_expert = results[0][0]
        assert top_expert.id == "dynamodb"


@pytest.mark.asyncio
async def test_expert_similarity_search(test_environment):
    """Test finding similar experts."""
    vector_db = test_environment["vector_db"]
    
    # Find experts similar to Amplify expert
    similar = await vector_db.find_similar_experts(
        expert_id="amplify",
        similarity_type="overall",
        limit=2
    )
    
    # Should find other AWS-related experts
    assert len(similar) > 0
    similar_ids = [s[0] for s in similar]
    # DynamoDB might be similar due to AWS/backend overlap
    assert "dynamodb" in similar_ids or "cloudscape" in similar_ids