# Expert Registry MCP Server - Project Structure

**Last Updated: 2025-06-30**

## Overview

This project implements a high-performance MCP server for expert discovery, registration, and context injection using FastMCP v2, with integrated vector and graph database support.

## Directory Structure

```
expert-registry-mcp/
├── src/
│   └── expert_registry_mcp/
│       ├── __init__.py              # Package initialization
│       ├── server.py                # FastMCP server implementation
│       ├── models.py                # Pydantic data models
│       ├── registry.py              # Registry management with file watching
│       ├── selection.py             # Expert selection engine
│       ├── context.py               # Context loading and injection
│       ├── vector_db.py             # Vector database integration (ChromaDB)
│       ├── graph_db.py              # Graph database integration (Neo4j)
│       ├── embeddings.py            # Embedding generation pipeline
│       └── discovery.py             # Hybrid discovery algorithms
│
├── tests/
│   ├── test_registry.py             # Registry management tests
│   ├── test_selection.py            # Selection engine tests
│   ├── test_vector_db.py            # Vector database tests
│   ├── test_graph_db.py             # Graph database tests
│   └── test_integration.py          # End-to-end integration tests
│
├── docs/
│   ├── python-code-updates.md       # Python implementation examples
│   └── typescript-examples/         # Legacy TypeScript reference
│       ├── expert-registry-mcp-server-example.ts
│       ├── typescript-package-example.json
│       └── typescript-readme.md
│
├── scripts/
│   ├── setup_databases.py           # Database initialization script
│   ├── import_registry.py           # Import existing registry
│   └── generate_embeddings.py       # Pre-generate embeddings
│
├── expert-system/                   # Default expert system directory
│   ├── registry/
│   │   └── expert-registry.json     # Central expert registry
│   ├── expert-contexts/
│   │   ├── aws-amplify-gen2.md      # Expert context files
│   │   ├── aws-cloudscape.md
│   │   └── ...
│   ├── vector-db/                   # ChromaDB storage
│   └── performance/
│       └── metrics.json             # Performance tracking
│
├── pyproject.toml                   # Project configuration (uv/pip)
├── README.md                        # Main documentation
├── expert-registry-mcp-design.md    # Architecture design document
├── PROJECT_STRUCTURE.md             # This file
├── LICENSE                          # MIT License
└── .gitignore                       # Git ignore patterns
```

## Key Components

### Core Server (`src/expert_registry_mcp/`)

- **server.py**: Main FastMCP server with all tool definitions
- **models.py**: Pydantic models for type safety and validation
- **registry.py**: File-based registry with hot reload support
- **selection.py**: Technology detection and expert scoring
- **context.py**: Expert knowledge management

### Database Integration

- **vector_db.py**: ChromaDB integration for semantic search
- **graph_db.py**: Neo4j integration for relationship modeling
- **embeddings.py**: Sentence transformer pipeline
- **discovery.py**: Hybrid search combining vector and graph

### Testing (`tests/`)

Comprehensive test suite using pytest and pytest-asyncio for:
- Unit tests for each component
- Integration tests for database operations
- End-to-end workflow tests

### Documentation (`docs/`)

- Implementation guides and examples
- Legacy TypeScript reference (for historical context)
- API documentation

### Scripts (`scripts/`)

Utility scripts for:
- Database setup and initialization
- Registry import from existing systems
- Embedding pre-generation for performance

## Data Flow

1. **Registry Loading**: File watcher monitors `expert-registry.json`
2. **Embedding Generation**: Automatic generation on registry updates
3. **Database Sync**: Updates propagated to both vector and graph DBs
4. **Query Processing**: Hybrid search across both databases
5. **Context Injection**: Expert knowledge enhancement of prompts
6. **Performance Tracking**: Analytics stored and used for optimization

## Configuration

### Environment Variables

- `EXPERT_SYSTEM_PATH`: Base path for expert system files
- `NEO4J_URI`: Neo4j connection URI (default: bolt://localhost:7687)
- `NEO4J_PASSWORD`: Neo4j authentication password
- `CHROMA_PERSIST_PATH`: ChromaDB persistence directory
- `EMBEDDING_MODEL`: Model for embeddings (default: all-MiniLM-L6-v2)

### Configuration Files

- `pyproject.toml`: Package dependencies and tool configurations
- `expert-registry.json`: Central registry of all experts
- Expert context files: Markdown files with expert knowledge

## Development Workflow

1. **Setup Environment**:
   ```bash
   uv venv
   uv pip install -e ".[dev]"
   ```

2. **Start Databases**:
   ```bash
   docker-compose up -d  # Neo4j
   # ChromaDB is embedded
   ```

3. **Run Tests**:
   ```bash
   pytest
   pytest --cov=expert_registry_mcp
   ```

4. **Start Server**:
   ```bash
   fastmcp run expert-registry-mcp
   ```

## Integration

The server integrates with:
- Claude Desktop via MCP protocol
- Multi-agent workflows for expert-enhanced operations
- CI/CD pipelines for automated testing
- Monitoring systems for performance tracking