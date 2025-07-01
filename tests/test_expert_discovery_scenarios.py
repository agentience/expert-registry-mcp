"""Tests for expert discovery scenarios using the complete system."""

import pytest
import tempfile
from pathlib import Path
import json
from datetime import datetime

from expert_registry_mcp.server import ExpertRegistryServer
from expert_registry_mcp.models import TaskType


@pytest.mark.asyncio
async def test_server_expert_discovery_scenarios():
    """Test the complete expert discovery system through the server interface."""
    
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
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.95,
                        "bug-fix": 0.85,
                        "refactoring": 0.80
                    },
                    "constraints": ["Use TypeScript-first approach"],
                    "patterns": ["Infrastructure as Code with CDK"]
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
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.90,
                        "bug-fix": 0.95,
                        "refactoring": 0.85
                    },
                    "constraints": ["Follow Cloudscape design guidelines"],
                    "patterns": ["Component composition patterns"]
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
                            "frameworks": ["AWS SDK"],
                            "expertise_level": "expert"
                        }
                    ],
                    "workflow_compatibility": {
                        "feature": 0.88,
                        "investigation": 0.95
                    },
                    "constraints": ["Follow single-table design patterns"],
                    "patterns": ["Single-table design pattern"]
                }
            ]
        }
        
        with open(registry_path, 'w') as f:
            json.dump(test_registry, f, indent=2)
        
        # Create server instance
        server = ExpertRegistryServer(base_path=str(base_path))
        
        try:
            # Initialize but skip graph DB (would require Neo4j)
            await server.registry_manager.initialize()
            
            # Test basic registry functionality
            experts = await server.registry_manager.list_experts()
            assert len(experts) == 3
            
            # Test expert retrieval
            amplify_expert = await server.registry_manager.get_expert("amplify")
            assert amplify_expert is not None
            assert amplify_expert.name == "AWS Amplify Gen 2 Expert"
            
            cloudscape_expert = await server.registry_manager.get_expert("cloudscape")
            assert cloudscape_expert is not None
            assert "frontend" in cloudscape_expert.domains
            
            dynamodb_expert = await server.registry_manager.get_expert("dynamodb")
            assert dynamodb_expert is not None
            assert "database" in dynamodb_expert.domains
            
            # Test technology detection scenarios
            from expert_registry_mcp.selection import SelectionEngine
            
            selection_engine = SelectionEngine(server.registry_manager)
            
            # Scenario 1: Serverless backend with Amplify
            amplify_result = await selection_engine.select_optimal_expert(
                task_description="Build a serverless API with authentication",
                technologies=["AWS Amplify", "TypeScript"],
                task_type=TaskType.FEATURE
            )
            assert amplify_result.expert.id == "amplify"
            assert amplify_result.score.total_score > 0.6
            
            # Scenario 2: UI components with Cloudscape
            cloudscape_result = await selection_engine.select_optimal_expert(
                task_description="Create dashboard with tables and forms",
                technologies=["AWS Cloudscape", "React"],
                task_type=TaskType.FEATURE
            )
            assert cloudscape_result.expert.id == "cloudscape"
            assert cloudscape_result.score.total_score > 0.6
            
            # Scenario 3: Database design with DynamoDB
            dynamodb_result = await selection_engine.select_optimal_expert(
                task_description="Design scalable NoSQL database schema",
                technologies=["DynamoDB"],
                task_type=TaskType.FEATURE
            )
            assert dynamodb_result.expert.id == "dynamodb"
            assert dynamodb_result.score.total_score > 0.6
            
            # Scenario 4: Bug fix task (should prefer high bug-fix compatibility)
            bug_fix_result = await selection_engine.select_optimal_expert(
                task_description="Fix dropdown component issue",
                technologies=["AWS Cloudscape"],
                task_type=TaskType.BUG_FIX
            )
            assert bug_fix_result.expert.id == "cloudscape"  # High bug-fix compatibility
            
            # Scenario 5: Investigation task
            investigation_result = await selection_engine.select_optimal_expert(
                task_description="Investigate database performance issues",
                technologies=["DynamoDB"],
                task_type=TaskType.INVESTIGATION
            )
            assert investigation_result.expert.id == "dynamodb"  # High investigation compatibility
            
            # Scenario 6: Search by domain
            backend_experts = await server.registry_manager.list_experts(domain="backend")
            backend_ids = {e.id for e in backend_experts}
            assert "amplify" in backend_ids
            assert "dynamodb" in backend_ids
            
            frontend_experts = await server.registry_manager.list_experts(domain="frontend")
            frontend_ids = {e.id for e in frontend_experts}
            assert "cloudscape" in frontend_ids
            
            # Scenario 7: Search by technology
            react_experts = await server.registry_manager.list_experts(technology="React")
            react_ids = {e.id for e in react_experts}
            assert "cloudscape" in react_ids
            
            # Scenario 8: Text search
            aws_experts = await server.registry_manager.search_experts("AWS")
            assert len(aws_experts) == 3  # All are AWS experts
            
            serverless_experts = await server.registry_manager.search_experts("serverless")
            serverless_ids = {e.id for e in serverless_experts}
            assert "amplify" in serverless_ids
            
            ui_experts = await server.registry_manager.search_experts("interface")
            ui_ids = {e.id for e in ui_experts}
            assert "cloudscape" in ui_ids
            
            # Scenario 9: Team formation
            team_combinations = await selection_engine.find_expert_combinations(
                requirements=["AWS Amplify", "AWS Cloudscape"],
                team_size=2
            )
            assert len(team_combinations) > 0
            team_experts, coverage = team_combinations[0]
            team_ids = {e.id for e in team_experts}
            assert "amplify" in team_ids
            assert "cloudscape" in team_ids
            assert coverage > 0.8
            
            print("✅ All expert selection scenarios passed!")
            
        finally:
            await server.cleanup()


@pytest.mark.asyncio
async def test_vector_search_scenarios():
    """Test vector search scenarios separately."""
    
    with tempfile.TemporaryDirectory() as tmpdir:
        from expert_registry_mcp.vector_db import VectorDatabaseManager
        from expert_registry_mcp.models import Expert, ExpertSpecialization
        
        vector_db = VectorDatabaseManager(
            persist_path=Path(tmpdir) / "vector-db",
            embedding_model="all-MiniLM-L6-v2"
        )
        
        # Create test experts
        amplify_expert = Expert(
            id="amplify",
            name="AWS Amplify Gen 2 Expert",
            version="1.0.0",
            description="Expert in serverless backend development with AWS Amplify",
            domains=["backend", "serverless"],
            specializations=[
                ExpertSpecialization(
                    technology="AWS Amplify",
                    frameworks=["CDK"],
                    expertise_level="expert"
                )
            ]
        )
        
        cloudscape_expert = Expert(
            id="cloudscape",
            name="AWS Cloudscape Expert",
            version="1.0.0",
            description="Expert in building user interfaces with Cloudscape design system",
            domains=["frontend", "ui"],
            specializations=[
                ExpertSpecialization(
                    technology="AWS Cloudscape",
                    frameworks=["React"],
                    expertise_level="expert"
                )
            ]
        )
        
        # Index experts
        await vector_db.index_expert(amplify_expert)
        await vector_db.index_expert(cloudscape_expert)
        
        # Test semantic search scenarios
        
        # Scenario 1: Search for backend expertise
        backend_results = await vector_db.search_experts(
            query="build serverless API backend",
            search_mode="hybrid",
            limit=2
        )
        
        assert len(backend_results) > 0
        # Amplify should rank higher for backend tasks
        top_expert_id = backend_results[0][0]
        assert top_expert_id == "amplify"
        
        # Scenario 2: Search for frontend expertise
        frontend_results = await vector_db.search_experts(
            query="create user interface dashboard",
            search_mode="hybrid",
            limit=2
        )
        
        assert len(frontend_results) > 0
        # Cloudscape should rank higher for UI tasks
        top_expert_id = frontend_results[0][0]
        assert top_expert_id == "cloudscape"
        
        print("✅ Vector search scenarios passed!")


if __name__ == "__main__":
    import asyncio
    
    async def main():
        await test_server_expert_discovery_scenarios()
        await test_vector_search_scenarios()
        print("🎉 All expert selection tests passed!")
    
    asyncio.run(main())