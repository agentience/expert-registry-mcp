# Python Code Updates for Design Document

**Last Updated: 2025-06-30**

## Database Client Examples

### ChromaDB (Vector Database)
```python
# Embedded, lightweight, perfect for local MCP server
import chromadb

client = chromadb.Client()
# or with persistence
client = chromadb.PersistentClient(path="./expert-system/vector-db")

# Benefits:
# - Embedded (no separate server)
# - Python & JS clients
# - Built-in persistence
# - Simple API
```

### Weaviate (For Advanced Features)
```python
# More features but requires Docker
import weaviate

client = weaviate.Client(
    url="http://localhost:8080",
)

# Benefits:
# - Hybrid search (vector + keyword)
# - GraphQL API
# - Schema enforcement
# - More scalable
```

### Qdrant (For Performance)
```python
# High performance, Rust-based
from qdrant_client import QdrantClient

client = QdrantClient(
    host="localhost",
    port=6333,
)

# Benefits:
# - Extremely fast
# - Low memory footprint
# - Advanced filtering
# - Rust performance
```

### Neo4j (Graph Database)
```python
# Most mature graph database
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "password")
)

# Benefits:
# - Cypher query language
# - ACID compliance
# - Rich relationship modeling
# - Large ecosystem
```

### ArangoDB (For Flexibility)
```python
# Multi-model: Document, Graph, Key-Value
from arango import ArangoClient

client = ArangoClient(hosts='http://localhost:8529')
db = client.db('_system', username='root', password='password')

# Benefits:
# - Multi-model database
# - AQL query language
# - Horizontal scaling
# - Python friendly
```

### DuckDB (For Embedded Analytics)
```python
# Embedded analytical database
import duckdb

conn = duckdb.connect(':memory:')
# Install and load graph extension
conn.execute('INSTALL graph')
conn.execute('LOAD graph')

# Benefits:
# - Fully embedded
# - No separate server
# - SQL with graph extensions
# - Excellent performance
```

## Data Models (Pydantic)

### Vector Embeddings Model
```python
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class ExpertEmbedding(BaseModel):
    expert_id: str
    embeddings: Dict[str, List[float]] = {
        "description": [],      # 384-dim from all-MiniLM-L6-v2
        "domains": [],         # Domain-specific embeddings
        "technologies": [],    # Technology stack embeddings
        "patterns": [],        # Code pattern embeddings
        "constraints": []      # Constraint embeddings
    }
    metadata: Dict[str, any] = {
        "model": "all-MiniLM-L6-v2",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }

class TaskEmbedding(BaseModel):
    task_id: str
    embedding: List[float]     # Task description embedding
    context: Dict[str, List[str]] = {
        "technologies": [],
        "codebase_features": [],
        "requirements": []
    }
```

## Discovery Classes

### Semantic Search with Vector DB
```python
from typing import List, Optional
import chromadb
from sentence_transformers import SentenceTransformer

class SemanticExpertDiscovery:
    def __init__(self):
        self.vector_db = chromadb.Client()
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    async def discover_experts(self, task_description: str, limit: int = 5):
        # 1. Generate task embedding
        task_embedding = self.embedder.encode(task_description)
        
        # 2. Search across multiple embedding spaces
        results = []
        
        # Search by description similarity
        desc_results = self.vector_db.collection('expert-descriptions').query(
            query_embeddings=[task_embedding],
            n_results=limit * 2
        )
        results.append(desc_results)
        
        # Search by pattern matching
        pattern_results = self.vector_db.collection('expert-patterns').query(
            query_embeddings=[task_embedding],
            n_results=limit
        )
        results.append(pattern_results)
        
        # 3. Combine and rank results
        return self.rank_results(results)
```

### Graph-Based Discovery
```python
from neo4j import AsyncGraphDatabase

class GraphExpertDiscovery:
    def __init__(self, uri: str, auth: tuple):
        self.driver = AsyncGraphDatabase.driver(uri, auth=auth)
    
    async def discover_expert_network(self, task_requirements: List[str]):
        # 1. Find experts through technology relationships
        query = """
        MATCH (t:Technology)
        WHERE t.name IN $technologies
        MATCH (e:Expert)-[:SPECIALIZES_IN]->(t)
        OPTIONAL MATCH (e)-[:SUCCEEDED_WITH]->(task:Task)
        WHERE task.type = $task_type
        WITH e, count(DISTINCT t) as tech_matches, 
             count(task) as success_count
        ORDER BY tech_matches DESC, success_count DESC
        LIMIT $limit
        RETURN e, tech_matches, success_count
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, {
                "technologies": task_requirements,
                "task_type": "refactoring",
                "limit": 5
            })
            return await self.process_graph_results(result)
```

### Hybrid Search Strategy
```python
from cachetools import LRUCache
from typing import Dict, Any

class HybridExpertDiscovery:
    def __init__(self, semantic_engine, graph_engine):
        self.semantic = semantic_engine
        self.graph = graph_engine
        self.cache = LRUCache(maxsize=100)
    
    async def discover(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        cache_key = self.get_cache_key(context)
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # 1. Parallel discovery across both systems
        semantic_results = await self.semantic.discover_experts(
            context['description']
        )
        graph_results = await self.graph.discover_expert_network(
            context['technologies']
        )
        
        # 2. Merge and score results
        merged = self.merge_results(semantic_results, graph_results)
        
        # 3. Apply collaborative filtering
        enhanced = await self.apply_collaborative_filtering(merged, context)
        
        # 4. Cache results
        self.cache[cache_key] = enhanced
        
        return enhanced
```

## Performance Optimizations

### Optimized Discovery with Annoy
```python
from annoy import AnnoyIndex
from cachetools import LRUCache

class OptimizedDiscovery:
    def __init__(self, vector_dim: int = 384):
        self.vector_index = AnnoyIndex(vector_dim, 'angular')
        self.graph_cache = LRUCache(maxsize=1000)
        self.precomputed_pairs = {}
    
    async def initialize(self):
        # Build Annoy index for ultra-fast similarity search
        experts = await self.get_all_experts()
        
        for i, expert in enumerate(experts):
            self.vector_index.add_item(i, expert.embedding)
        
        self.vector_index.build(10)  # 10 trees
        self.vector_index.save('./expert-system/vector-index.ann')
        
        # Precompute common expert pairs
        await self.precompute_expert_pairs()
        
        # Warm up caches
        await self.warmup_caches()
    
    async def fast_similarity_search(self, query: List[float], k: int = 5):
        # Sub-millisecond similarity search
        indices = self.vector_index.get_nns_by_vector(query, k)
        return await self.hydrate_results(indices)
```

This document provides the correct Python implementations for all the code examples in the design document.