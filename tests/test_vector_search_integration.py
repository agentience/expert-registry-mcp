"""Integration tests for vector search functionality."""

import pytest
import pytest_asyncio
import tempfile
from pathlib import Path

from expert_registry_mcp.vector_db import VectorDatabaseManager
from expert_registry_mcp.embeddings import EmbeddingPipeline
from expert_registry_mcp.models import Expert, ExpertSpecialization


@pytest_asyncio.fixture
async def vector_setup():
    """Set up vector database with test experts."""
    with tempfile.TemporaryDirectory() as tmpdir:
        vector_db = VectorDatabaseManager(
            persist_path=Path(tmpdir) / "vector-db",
            embedding_model="all-MiniLM-L6-v2"
        )
        
        embedding_pipeline = EmbeddingPipeline(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Create test experts
        experts = [
            Expert(
                id="amplify",
                name="AWS Amplify Gen 2 Expert",
                version="1.0.0",
                description="Expert in AWS Amplify Gen 2 development, specializing in serverless backend infrastructure",
                domains=["backend", "cloud", "serverless"],
                specializations=[
                    ExpertSpecialization(
                        technology="AWS Amplify Gen 2",
                        frameworks=["AWS CDK", "TypeScript"],
                        expertise_level="expert"
                    )
                ],
                constraints=["Use TypeScript-first approach"],
                patterns=["Infrastructure as Code with CDK"]
            ),
            Expert(
                id="cloudscape",
                name="AWS Cloudscape Design System Expert",
                version="1.0.0",
                description="Expert in building cloud management interfaces with AWS Cloudscape components",
                domains=["frontend", "ui", "design-system"],
                specializations=[
                    ExpertSpecialization(
                        technology="AWS Cloudscape",
                        frameworks=["React", "TypeScript"],
                        expertise_level="expert"
                    )
                ],
                constraints=["Follow Cloudscape design guidelines"],
                patterns=["Component composition patterns"]
            ),
            Expert(
                id="dynamodb",
                name="AWS DynamoDB Expert",
                version="1.0.0",
                description="Expert in DynamoDB NoSQL database design and single-table patterns",
                domains=["database", "backend", "nosql"],
                specializations=[
                    ExpertSpecialization(
                        technology="AWS DynamoDB",
                        frameworks=["AWS SDK"],
                        expertise_level="expert"
                    )
                ],
                constraints=["Follow single-table design patterns"],
                patterns=["Single-table design pattern"]
            )
        ]
        
        # Index experts
        for expert in experts:
            await vector_db.index_expert(expert)
        
        yield vector_db, embedding_pipeline, experts


@pytest.mark.asyncio
async def test_semantic_search_backend(vector_setup):
    """Test semantic search for backend development."""
    vector_db, _, _ = vector_setup
    
    # Search for serverless backend expert
    results = await vector_db.search_experts(
        query="build serverless API with authentication",
        search_mode="hybrid",
        limit=3
    )
    
    assert len(results) > 0
    # Amplify should rank high for serverless backend
    expert_ids = [r[0] for r in results]
    assert "amplify" in expert_ids[:2]


@pytest.mark.asyncio
async def test_semantic_search_frontend(vector_setup):
    """Test semantic search for frontend development."""
    vector_db, _, _ = vector_setup
    
    # Search for UI expert
    results = await vector_db.search_experts(
        query="create dashboard with tables and forms",
        search_mode="hybrid",
        limit=3
    )
    
    assert len(results) > 0
    # Cloudscape should rank high for UI components
    expert_ids = [r[0] for r in results]
    assert "cloudscape" in expert_ids[:2]


@pytest.mark.asyncio
async def test_semantic_search_database(vector_setup):
    """Test semantic search for database tasks."""
    vector_db, _, _ = vector_setup
    
    # Search for database expert
    results = await vector_db.search_experts(
        query="design scalable NoSQL database schema",
        search_mode="hybrid",
        limit=3
    )
    
    assert len(results) > 0
    # DynamoDB should rank high for NoSQL database
    expert_ids = [r[0] for r in results]
    assert "dynamodb" in expert_ids[:2]


@pytest.mark.asyncio
async def test_pattern_search(vector_setup):
    """Test searching by patterns."""
    vector_db, _, _ = vector_setup
    
    # Search for single-table pattern
    results = await vector_db.search_experts(
        query="single-table design pattern",
        search_mode="patterns",
        limit=3
    )
    
    # DynamoDB expert should match
    expert_ids = [r[0] for r in results]
    assert "dynamodb" in expert_ids


@pytest.mark.asyncio
async def test_constraint_search(vector_setup):
    """Test searching by constraints."""
    vector_db, _, _ = vector_setup
    
    # Search for TypeScript constraint
    results = await vector_db.search_experts(
        query="TypeScript-first approach",
        search_mode="constraints",
        limit=3
    )
    
    # Amplify expert should match
    expert_ids = [r[0] for r in results]
    assert "amplify" in expert_ids


@pytest.mark.asyncio
async def test_find_similar_experts(vector_setup):
    """Test finding similar experts."""
    vector_db, _, _ = vector_setup
    
    # Find experts similar to Amplify
    similar = await vector_db.find_similar_experts(
        expert_id="amplify",
        similarity_type="overall",
        limit=2
    )
    
    assert len(similar) > 0
    # Should find other experts
    assert similar[0][0] in ["cloudscape", "dynamodb"]
    assert similar[0][1] > 0  # Similarity score


@pytest.mark.asyncio
async def test_embedding_generation(vector_setup):
    """Test embedding generation for experts."""
    _, embedding_pipeline, experts = vector_setup
    
    # Generate embeddings for Amplify expert
    amplify_expert = experts[0]
    embeddings = await embedding_pipeline.process_expert(amplify_expert)
    
    assert embeddings.expert_id == "amplify"
    assert "description" in embeddings.embeddings
    assert "technologies" in embeddings.embeddings
    assert "patterns" in embeddings.embeddings
    assert "constraints" in embeddings.embeddings
    
    # Check embedding dimensions
    for key, emb in embeddings.embeddings.items():
        assert len(emb) == 384  # all-MiniLM-L6-v2 dimension


@pytest.mark.asyncio
async def test_task_similarity(vector_setup):
    """Test task embedding enhancement."""
    _, embedding_pipeline, _ = vector_setup
    
    # Create task embedding with context
    task_desc = "Build a serverless API"
    context = {
        "technologies": ["AWS Lambda", "DynamoDB"],
        "constraints": ["Must be scalable", "Use TypeScript"],
        "requirements": ["Authentication", "Real-time updates"]
    }
    
    enhanced_embedding = await embedding_pipeline.enhance_task_embedding(
        task_desc, context
    )
    
    assert len(enhanced_embedding) == 384
    
    # Compare with basic embedding
    basic_embedding = await embedding_pipeline.embed(task_desc)
    
    # Enhanced should be different due to context
    assert enhanced_embedding != basic_embedding