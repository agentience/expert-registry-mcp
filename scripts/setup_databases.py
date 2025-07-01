#!/usr/bin/env python3
"""Setup and initialize vector and graph databases for Expert Registry MCP Server."""

import asyncio
import os
import sys
from pathlib import Path
import logging

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.expert_registry_mcp.vector_db import VectorDatabaseManager
from src.expert_registry_mcp.graph_db import GraphDatabaseManager
from src.expert_registry_mcp.registry import RegistryManager
from src.expert_registry_mcp.embeddings import EmbeddingPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def setup_databases():
    """Initialize and setup vector and graph databases."""
    # Get paths from environment
    base_path = Path(os.getenv("EXPERT_SYSTEM_PATH", "./expert-system"))
    
    logger.info(f"Setting up databases with base path: {base_path}")
    
    # Initialize components
    logger.info("Initializing registry manager...")
    registry_manager = RegistryManager(base_path / "registry" / "expert-registry.json")
    await registry_manager.initialize()
    
    logger.info("Initializing vector database...")
    vector_db = VectorDatabaseManager(
        persist_path=base_path / "vector-db",
        embedding_model=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    )
    
    logger.info("Initializing graph database...")
    graph_db = GraphDatabaseManager(
        uri=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        password=os.getenv("NEO4J_PASSWORD", "password")
    )
    
    try:
        await graph_db.initialize()
    except Exception as e:
        logger.error(f"Failed to connect to Neo4j: {e}")
        logger.info("Make sure Neo4j is running. You can start it with:")
        logger.info("  docker run -d --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest")
        return False
        
    logger.info("Initializing embedding pipeline...")
    embedding_pipeline = EmbeddingPipeline(
        model_name=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    )
    
    # Load experts from registry
    logger.info("Loading experts from registry...")
    experts = await registry_manager.list_experts(include_metrics=True)
    logger.info(f"Found {len(experts)} experts to index")
    
    # Index each expert
    for i, expert in enumerate(experts):
        logger.info(f"Processing expert {i+1}/{len(experts)}: {expert.id}")
        
        try:
            # Generate embeddings
            logger.info(f"  - Generating embeddings...")
            embeddings = await embedding_pipeline.process_expert(expert)
            
            # Index in vector database
            logger.info(f"  - Indexing in vector database...")
            await vector_db.index_expert(expert)
            
            # Index in graph database
            logger.info(f"  - Indexing in graph database...")
            await graph_db.index_expert(expert)
            
        except Exception as e:
            logger.error(f"  - Failed to process expert {expert.id}: {e}")
            
    # Get statistics
    logger.info("\nDatabase setup complete!")
    
    # Vector DB stats
    vector_stats = await vector_db.get_collection_stats()
    logger.info("\nVector Database Statistics:")
    for collection, count in vector_stats.items():
        logger.info(f"  - {collection}: {count} documents")
        
    # Graph DB health check
    graph_health = await graph_db.health_check()
    logger.info(f"\nGraph Database Status: {'Connected' if graph_health else 'Not Connected'}")
    
    # Cleanup
    await registry_manager.cleanup()
    await graph_db.close()
    
    return True


async def reset_databases():
    """Reset all databases (useful for testing)."""
    response = input("WARNING: This will delete all data. Continue? (yes/no): ")
    if response.lower() != "yes":
        logger.info("Reset cancelled")
        return
        
    base_path = Path(os.getenv("EXPERT_SYSTEM_PATH", "./expert-system"))
    
    # Reset vector database
    logger.info("Resetting vector database...")
    vector_db = VectorDatabaseManager(persist_path=base_path / "vector-db")
    await vector_db.reset_database()
    
    # Reset graph database would require more complex operations
    logger.info("Graph database reset not implemented - please reset manually if needed")
    

async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Setup Expert Registry databases")
    parser.add_argument("--reset", action="store_true", help="Reset all databases")
    args = parser.parse_args()
    
    if args.reset:
        await reset_databases()
    else:
        success = await setup_databases()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())