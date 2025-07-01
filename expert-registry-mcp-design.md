# Expert Registry MCP Server Design

**Last Updated: 2025-06-30**

## Overview

This document outlines the design for implementing the expert-system as a high-performance MCP (Model Context Protocol) server with vector and graph database integration. The server provides expert discovery, registration, and context injection capabilities while maintaining file-based updates and optimal performance through semantic search and relationship modeling.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Expert Registry MCP Server                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐           │
│  │   Registry   │  │  Selection   │  │    Context      │           │
│  │  Management  │  │   Engine     │  │   Injection     │           │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘           │
│         │                 │                    │                     │
│  ┌──────┴─────────────────┴────────────────────┴────────┐          │
│  │                  Discovery Layer                       │          │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │          │
│  │  │   Vector    │  │    Graph     │  │   Hybrid    │ │          │
│  │  │  Database   │  │   Database   │  │   Search    │ │          │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │                   Core Services Layer                 │          │
│  │  • Caching  • File Watching  • Performance Tracking  │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │                   MCP Interface Layer                 │          │
│  │    Tools    │    Resources    │    Notifications     │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Options Analysis

### 1. Vector Database Options

#### ChromaDB (Recommended for Simplicity)
```python
# Embedded, lightweight, perfect for local MCP server
import chromadb

client = chromadb.Client(
  path: "./expert-system/vector-db"
});

// Benefits:
// - Embedded (no separate server)
// - Python & JS clients
// - Built-in persistence
// - Simple API
```

#### Weaviate (For Advanced Features)
```python
// More features but requires Docker
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

// Benefits:
// - Hybrid search (vector + keyword)
// - GraphQL API
// - Schema enforcement
// - More scalable
```

#### Qdrant (For Performance)
```python
// High performance, Rust-based
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  host: 'localhost',
  port: 6333,
});

// Benefits:
// - Extremely fast
// - Low memory footprint
// - Advanced filtering
// - Rust performance
```

### 2. Graph Database Options

#### Neo4j (Recommended for Features)
```python
// Most mature graph database
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
);

// Benefits:
// - Cypher query language
// - ACID compliance
// - Rich relationship modeling
// - Large ecosystem
```

#### ArangoDB (For Flexibility)
```python
// Multi-model: Document, Graph, Key-Value
import { Database } from 'arangojs';

const db = new Database({
  url: 'http://localhost:8529',
});

// Benefits:
// - Multi-model database
// - AQL query language
// - Horizontal scaling
// - JavaScript friendly
```

#### DuckDB + Graph Extension (For Embedded)
```python
// Embedded analytical database with graph capabilities
import { Database } from 'duckdb-async';

const db = await Database.create(':memory:');
await db.run('INSTALL graph; LOAD graph;');

// Benefits:
// - Fully embedded
// - No separate server
// - SQL with graph extensions
// - Excellent performance
```

## Enhanced Data Models

### 1. Vector Embeddings Model

```python
interface ExpertEmbedding {
  expertId: string;
  embeddings: {
    description: number[];        // 384-dim from all-MiniLM-L6-v2
    domains: number[];           // Domain-specific embeddings
    technologies: number[];      // Technology stack embeddings
    patterns: number[];          // Code pattern embeddings
    constraints: number[];       // Constraint embeddings
  };
  metadata: {
    model: string;              // Embedding model used
    timestamp: Date;
    version: string;
  };
}

interface TaskEmbedding {
  taskId: string;
  embedding: number[];          // Task description embedding
  context: {
    technologies: string[];
    codebaseFeatures: string[];
    requirements: string[];
  };
}
```

### 2. Graph Relationships Model

```python
// Neo4j Cypher Schema
interface GraphSchema {
  nodes: {
    Expert: {
      id: string;
      name: string;
      version: string;
      embedding: number[];
    };
    Technology: {
      name: string;
      category: string;
      embedding: number[];
    };
    Domain: {
      name: string;
      description: string;
    };
    Task: {
      id: string;
      type: string;
      description: string;
      embedding: number[];
    };
    Pattern: {
      id: string;
      name: string;
      description: string;
    };
  };
  relationships: {
    SPECIALIZES_IN: 'Expert -> Technology',
    COMPATIBLE_WITH: 'Expert -> Technology',
    BELONGS_TO: 'Technology -> Domain',
    REQUIRES: 'Task -> Technology',
    USES_PATTERN: 'Expert -> Pattern',
    RELATED_TO: 'Technology -> Technology',
    SUCCEEDED_WITH: 'Task -> Expert',
  };
}
```

## Enhanced Discovery Algorithms

### 1. Semantic Search with Vector DB

```python
class SemanticExpertDiscovery {
  private vectorDB: ChromaClient;
  private embedder: EmbeddingModel;

  async discoverExperts(taskDescription: string, limit: number = 5) {
    // 1. Generate task embedding
    const taskEmbedding = await this.embedder.embed(taskDescription);

    // 2. Search across multiple embedding spaces
    const results = await Promise.all([
      // Search by description similarity
      this.vectorDB.collection('expert-descriptions').query({
        queryEmbeddings: [taskEmbedding],
        nResults: limit * 2,
      }),
      
      // Search by pattern matching
      this.vectorDB.collection('expert-patterns').query({
        queryEmbeddings: [taskEmbedding],
        nResults: limit,
      }),
      
      // Search by constraint compatibility
      this.vectorDB.collection('expert-constraints').query({
        queryEmbeddings: [taskEmbedding],
        nResults: limit,
      }),
    ]);

    // 3. Combine and rank results
    return this.rankResults(results);
  }

  async findSimilarExperts(expertId: string, limit: number = 3) {
    const expert = await this.getExpertEmbedding(expertId);
    
    return this.vectorDB.collection('experts').query({
      queryEmbeddings: [expert.embeddings.description],
      where: { id: { $ne: expertId } },
      nResults: limit,
    });
  }
}
```

### 2. Graph-Based Discovery

```python
class GraphExpertDiscovery {
  private graphDB: Neo4jDriver;

  async discoverExpertNetwork(taskRequirements: string[]) {
    // 1. Find experts through technology relationships
    const query = `
      MATCH (t:Technology)
      WHERE t.name IN $technologies
      MATCH (e:Expert)-[:SPECIALIZES_IN]->(t)
      OPTIONAL MATCH (e)-[:SUCCEEDED_WITH]->(task:Task)
      WHERE task.type = $taskType
      WITH e, count(DISTINCT t) as techMatches, 
           count(task) as successCount
      ORDER BY techMatches DESC, successCount DESC
      LIMIT $limit
      RETURN e, techMatches, successCount
    `;

    const result = await this.graphDB.run(query, {
      technologies: taskRequirements,
      taskType: 'refactoring',
      limit: 5
    });

    return this.processGraphResults(result);
  }

  async findExpertCombinations(technologies: string[]) {
    // Find complementary expert pairs
    const query = `
      MATCH (e1:Expert)-[:SPECIALIZES_IN]->(t1:Technology)
      WHERE t1.name IN $technologies
      MATCH (e2:Expert)-[:SPECIALIZES_IN]->(t2:Technology)
      WHERE t2.name IN $technologies 
        AND e1.id < e2.id
        AND NOT (e1)-[:SPECIALIZES_IN]->(t2)
      WITH e1, e2, 
           collect(DISTINCT t1.name) as e1Tech,
           collect(DISTINCT t2.name) as e2Tech
      WHERE size(e1Tech + e2Tech) >= size($technologies) * 0.8
      RETURN e1, e2, e1Tech, e2Tech
      LIMIT 3
    `;

    return this.graphDB.run(query, { technologies });
  }

  async getExpertLineage(expertId: string) {
    // Trace expert evolution and relationships
    const query = `
      MATCH (e:Expert {id: $expertId})
      OPTIONAL MATCH (e)-[:EVOLVED_FROM]->(previous:Expert)
      OPTIONAL MATCH (e)-[:RELATED_TO]->(related:Expert)
      OPTIONAL MATCH (e)-[:USES_PATTERN]->(p:Pattern)
      RETURN e, collect(DISTINCT previous) as previousVersions,
             collect(DISTINCT related) as relatedExperts,
             collect(DISTINCT p) as patterns
    `;

    return this.graphDB.run(query, { expertId });
  }
}
```

### 3. Hybrid Search Strategy

```python
class HybridExpertDiscovery {
  private semantic: SemanticExpertDiscovery;
  private graph: GraphExpertDiscovery;
  private cache: LRUCache<string, any>;

  async discover(context: DiscoveryContext): Promise<ExpertRecommendation[]> {
    const cacheKey = this.getCacheKey(context);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 1. Parallel discovery across both systems
    const [semanticResults, graphResults] = await Promise.all([
      this.semantic.discoverExperts(context.description),
      this.graph.discoverExpertNetwork(context.technologies)
    ]);

    // 2. Merge and score results
    const merged = this.mergeResults(semanticResults, graphResults);

    // 3. Apply collaborative filtering
    const enhanced = await this.applyCollaborativeFiltering(merged, context);

    // 4. Cache results
    this.cache.set(cacheKey, enhanced);

    return enhanced;
  }

  private mergeResults(semantic: any[], graph: any[]): ExpertCandidate[] {
    const scoreMap = new Map<string, ExpertScore>();

    // Weight semantic similarity
    semantic.forEach((result, index) => {
      const score = scoreMap.get(result.id) || { total: 0, components: {} };
      score.components.semantic = (1 - index / semantic.length) * 0.4;
      score.total += score.components.semantic;
      scoreMap.set(result.id, score);
    });

    // Weight graph relationships
    graph.forEach((result) => {
      const score = scoreMap.get(result.id) || { total: 0, components: {} };
      score.components.graph = result.techMatches / result.totalTech * 0.3;
      score.components.success = Math.min(result.successCount / 10, 1) * 0.3;
      score.total += score.components.graph + score.components.success;
      scoreMap.set(result.id, score);
    });

    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([id, score]) => ({ expertId: id, score }));
  }
}
```

## Enhanced MCP Tools

### Vector Search Tools

```json
{
  "name": "expert_semantic_search",
  "description": "Search experts using semantic similarity",
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "Natural language description of the task"
    },
    "searchMode": {
      "type": "string",
      "enum": ["description", "patterns", "constraints", "hybrid"],
      "default": "hybrid"
    },
    "limit": {
      "type": "number",
      "default": 5
    }
  }
}
```

```json
{
  "name": "expert_find_similar",
  "description": "Find experts similar to a given expert",
  "parameters": {
    "expertId": {
      "type": "string",
      "required": true
    },
    "similarity": {
      "type": "string",
      "enum": ["overall", "domain", "technology", "patterns"],
      "default": "overall"
    }
  }
}
```

### Graph Query Tools

```json
{
  "name": "expert_explore_network",
  "description": "Explore expert relationships and networks",
  "parameters": {
    "startExpertId": {
      "type": "string",
      "required": true
    },
    "depth": {
      "type": "number",
      "default": 2,
      "maximum": 4
    },
    "relationshipTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["SPECIALIZES_IN", "COMPATIBLE_WITH", "EVOLVED_FROM", "RELATED_TO"]
      }
    }
  }
}
```

```json
{
  "name": "expert_find_combinations",
  "description": "Find complementary expert combinations",
  "parameters": {
    "requirements": {
      "type": "array",
      "items": "string",
      "required": true,
      "description": "List of required technologies/skills"
    },
    "teamSize": {
      "type": "number",
      "default": 2,
      "minimum": 2,
      "maximum": 4
    }
  }
}
```

### Hybrid Discovery Tools

```json
{
  "name": "expert_smart_discover",
  "description": "Use AI-powered discovery combining vector and graph search",
  "parameters": {
    "context": {
      "type": "object",
      "required": true,
      "properties": {
        "description": {
          "type": "string",
          "required": true
        },
        "technologies": {
          "type": "array",
          "items": "string"
        },
        "constraints": {
          "type": "array",
          "items": "string"
        },
        "preferredStrategy": {
          "type": "string",
          "enum": ["single", "team", "evolutionary"]
        }
      }
    }
  }
}
```

## Implementation Architecture

### 1. Database Initialization

```python
class DatabaseManager {
  private vectorDB: ChromaClient;
  private graphDB: Neo4jDriver;
  private embedder: EmbeddingModel;

  async initialize() {
    // Initialize vector database
    this.vectorDB = new ChromaClient({ path: "./expert-system/vector-db" });
    
    // Create collections
    await this.createVectorCollections();
    
    // Initialize graph database
    this.graphDB = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD || 'password')
    );
    
    // Create graph schema
    await this.createGraphSchema();
    
    // Initialize embedding model
    this.embedder = new EmbeddingModel('all-MiniLM-L6-v2');
    
    // Sync with file system
    await this.syncDatabases();
  }

  private async createVectorCollections() {
    const collections = [
      'expert-descriptions',
      'expert-patterns',
      'expert-constraints',
      'technologies',
      'task-history'
    ];

    for (const name of collections) {
      await this.vectorDB.createCollection({
        name,
        metadata: { 'hnsw:space': 'cosine' }
      });
    }
  }

  private async createGraphSchema() {
    const constraints = [
      'CREATE CONSTRAINT expert_id IF NOT EXISTS FOR (e:Expert) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT tech_name IF NOT EXISTS FOR (t:Technology) REQUIRE t.name IS UNIQUE',
      'CREATE INDEX expert_embedding IF NOT EXISTS FOR (e:Expert) ON (e.embedding)',
      'CREATE INDEX task_type IF NOT EXISTS FOR (t:Task) ON (t.type)'
    ];

    for (const constraint of constraints) {
      await this.graphDB.run(constraint);
    }
  }

  async syncDatabases() {
    // Load registry
    const registry = await this.loadRegistry();
    
    // Update vector embeddings
    await this.updateVectorEmbeddings(registry.experts);
    
    // Update graph relationships
    await this.updateGraphRelationships(registry.experts);
  }
}
```

### 2. Embedding Pipeline

```python
class EmbeddingPipeline {
  private model: any; // Transformer model
  private cache: Map<string, number[]>;

  async processExpert(expert: Expert): Promise<ExpertEmbedding> {
    const embeddings = {
      description: await this.embed(expert.description),
      domains: await this.embedArray(expert.domains),
      technologies: await this.embedTechnologies(expert.specializations),
      patterns: await this.embedPatterns(expert.id),
      constraints: await this.embedConstraints(expert.id)
    };

    return {
      expertId: expert.id,
      embeddings,
      metadata: {
        model: 'all-MiniLM-L6-v2',
        timestamp: new Date(),
        version: expert.version
      }
    };
  }

  private async embedArray(texts: string[]): Promise<number[]> {
    const embeddings = await Promise.all(
      texts.map(text => this.embed(text))
    );
    return this.averageEmbeddings(embeddings);
  }

  private averageEmbeddings(embeddings: number[][]): number[] {
    const dim = embeddings[0].length;
    const avg = new Array(dim).fill(0);
    
    embeddings.forEach(emb => {
      emb.forEach((val, i) => avg[i] += val);
    });
    
    return avg.map(val => val / embeddings.length);
  }
}
```

### 3. Performance Optimizations

```python
class OptimizedDiscovery {
  private vectorIndex: AnnoyIndex;
  private graphCache: LRUCache<string, any>;
  private precomputedPairs: Map<string, string[]>;

  async initialize() {
    // Build Annoy index for ultra-fast similarity search
    this.vectorIndex = new AnnoyIndex(384, 'angular');
    await this.buildVectorIndex();

    // Precompute common expert pairs
    await this.precomputeExpertPairs();

    // Warm up caches
    await this.warmupCaches();
  }

  private async buildVectorIndex() {
    const experts = await this.getAllExperts();
    
    experts.forEach((expert, i) => {
      this.vectorIndex.addItem(i, expert.embedding);
    });
    
    this.vectorIndex.build(10); // 10 trees
    this.vectorIndex.save('./expert-system/vector-index.ann');
  }

  async fastSimilaritySearch(query: number[], k: number = 5) {
    // Sub-millisecond similarity search
    const indices = this.vectorIndex.getNNsByVector(query, k);
    return this.hydrateResults(indices);
  }
}
```

## Migration Strategy

### Phase 1: Add Vector Database (Week 1)
- Install ChromaDB
- Create embedding pipeline
- Index existing experts
- Add semantic search tools

### Phase 2: Add Graph Database (Week 2)
- Deploy Neo4j (or embedded alternative)
- Model relationships
- Import expert network
- Add graph query tools

### Phase 3: Implement Hybrid Search (Week 3)
- Combine vector and graph results
- Implement scoring algorithm
- Add caching layer
- Create hybrid tools

### Phase 4: Optimize Performance (Week 4)
- Build vector indices
- Precompute common queries
- Implement query planning
- Add monitoring

## Configuration

```json
{
  "expert-registry-mcp": {
    "databases": {
      "vector": {
        "type": "chromadb",
        "path": "./expert-system/vector-db",
        "embedding_model": "all-MiniLM-L6-v2"
      },
      "graph": {
        "type": "neo4j",
        "uri": "bolt://localhost:7687",
        "auth": {
          "user": "neo4j",
          "password": "${NEO4J_PASSWORD}"
        }
      }
    },
    "performance": {
      "vector_index_type": "annoy",
      "cache_size_mb": 200,
      "precompute_pairs": true,
      "warmup_on_start": true
    }
  }
}
```

## Benefits

### 1. Enhanced Discovery
- **Semantic Understanding**: Find experts by meaning, not just keywords
- **Relationship Awareness**: Understand how experts complement each other
- **Context-Aware**: Consider task context in selection

### 2. Better Recommendations
- **Similar Experts**: Find alternatives when primary expert unavailable
- **Expert Teams**: Automatically suggest complementary expert combinations
- **Evolution Tracking**: Understand expert version relationships

### 3. Performance
- **Sub-second Queries**: Vector indices enable millisecond searches
- **Scalability**: Handle thousands of experts efficiently
- **Smart Caching**: Precompute common patterns

### 4. Intelligence
- **Learning System**: Improve recommendations based on usage
- **Pattern Recognition**: Identify successful expert combinations
- **Predictive Selection**: Anticipate needs based on context

## Conclusion

Adding vector and graph databases transforms the Expert Registry from a simple lookup system to an intelligent discovery platform. The hybrid approach combines semantic understanding with relationship modeling for optimal expert selection.