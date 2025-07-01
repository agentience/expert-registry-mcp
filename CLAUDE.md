# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated: 2025-07-01**

## Development Commands

### Python Development
```bash
# Setup development environment with uv (recommended)
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -e ".[dev]"

# Or with pip
pip install -e ".[dev]"
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=expert_registry_mcp

# Run specific test file
pytest tests/test_registry.py
```

### Code Quality
```bash
# Format code
black src tests

# Lint code
ruff check src tests

# Type checking
mypy src
```

### Docker Development
```bash
# Build Docker image
./scripts/build.sh

# Deploy locally with Docker Compose
./scripts/deploy.sh

# Deploy with Redis caching
./scripts/deploy.sh with-redis

# View logs
./scripts/deploy.sh logs

# Stop services
./scripts/deploy.sh down
```

### Running the Server
```bash
# Development mode (local Python)
python -m expert_registry_mcp.server

# Or using FastMCP CLI
fastmcp run expert-registry-mcp

# Admin interface server
expert-registry-admin
```

## Architecture Overview

This is a high-performance MCP (Model Context Protocol) server for expert discovery and context injection, built with FastMCP v2. The system combines vector search, graph databases, and AI-powered discovery for intelligent expert selection.

### Core Components

**Server Layer** (`server.py`):
- FastMCP server implementation with 20+ MCP tools
- Hybrid discovery engine combining vector and graph search
- Multi-layer caching system for performance

**Data Management**:
- `registry.py` - Expert registry with file watching and hot reload
- `vector_db.py` - ChromaDB integration for semantic search
- `graph_db.py` - Neo4j integration for relationship modeling
- `models.py` - Pydantic data models for type safety

**AI Components**:
- `embeddings.py` - Sentence transformers for vector embeddings
- `discovery.py` - Hybrid AI-powered expert discovery
- `selection.py` - Expert selection algorithms
- `context.py` - Context injection and prompt enhancement

### Database Integration

**Vector Database (ChromaDB)**:
- Embedded database stored in `chroma_db/` directory
- Automatic embedding generation for experts
- Multiple collections for different search types
- No separate installation required

**Graph Database (Neo4j)**:
- Relationship modeling between experts, technologies, and tasks
- Team formation and synergy calculations
- Evolution tracking and lineage analysis
- Requires Neo4j instance (see docker-compose.yml)

### File Structure Conventions

**Expert System Data** (`expert-system/`):
```
expert-system/
├── registry/
│   └── expert-registry.json     # Expert definitions
├── expert-contexts/
│   ├── expert-name.md           # Expert context files
│   └── ...
└── vector-db/                   # ChromaDB storage
```

**Expert Context Files**:
- Markdown files named matching expert IDs
- Structured sections: Constraints, Patterns, Quality Standards
- Hot reload supported via file watching

## Development Patterns

### Adding New MCP Tools
1. Define tool function in `ExpertRegistryServer._register_tools()`
2. Use Pydantic annotations for parameter validation
3. Return structured data using models from `models.py`
4. Add error handling and logging

### Expert Registry Format
- JSON schema defined in README.md
- Version controlled with semantic versioning
- Specializations include technology, frameworks, expertise levels
- Workflow compatibility scores for different task types

### Testing Strategy
- Unit tests for core components (`test_registry.py`, `test_selection.py`)
- Integration tests for vector search (`test_vector_search_integration.py`)
- Scenario-based tests (`test_expert_discovery_scenarios.py`)

### Performance Considerations
- Multi-layer caching (registry, vector, graph, context)
- Precomputed expert combinations for team formation
- Vector indices with Annoy for sub-millisecond queries
- Batch operations for database updates

## Environment Configuration

Required environment variables:
```bash
export EXPERT_SYSTEM_PATH=/path/to/expert-system
export NEO4J_URI=bolt://localhost:7687
export NEO4J_PASSWORD=password
export EMBEDDING_MODEL=all-MiniLM-L6-v2  # Optional
```

## Database Setup

### Neo4j (Required)
```bash
# Docker (recommended)
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Access browser: http://localhost:7474
```

### ChromaDB (Embedded)
- Automatically initialized on first run
- Stored in `chroma_db/` directory
- No separate installation needed

## Admin Interface

Web-based admin interface for expert management:
```bash
# Start admin server
expert-registry-admin

# Or via Docker
./scripts/deploy.sh  # Includes admin UI at admin-ui/
```

Built with React + TypeScript, includes:
- Expert management and editing
- Context file editor
- Performance analytics
- Real-time updates via SSE

## Troubleshooting

### Common Issues
1. **Expert not found**: Verify expert ID in registry JSON
2. **Context file missing**: Check filename matches expert ID with .md extension
3. **Cache not updating**: File watcher may need restart, check permissions
4. **Database connection**: Verify Neo4j is running and credentials are correct

### Debug Mode
```bash
export FASTMCP_DEBUG=1
python -m expert_registry_mcp.server
```

## Docker Deployment

The system is containerized for production deployment:
- Multi-stage Dockerfile with development and production targets
- Docker Compose with Neo4j, optional Redis
- Volume mounts for data persistence and hot reload
- Health checks and restart policies