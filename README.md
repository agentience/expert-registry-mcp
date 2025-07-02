# Expert Registry MCP Server

**Last Updated: 2025-06-30**

A high-performance MCP server for expert discovery, registration, and context injection built with FastMCP v2, featuring vector and graph database integration for enhanced semantic search and relationship modeling.

## Features

- 🚀 **High Performance**: Multi-layer caching with vector indices for sub-millisecond queries
- 📁 **File-Based Updates**: Hot reload on registry/context file changes
- 🔍 **Semantic Search**: Vector database integration for meaning-based expert discovery
- 🔗 **Relationship Modeling**: Graph database for expert networks and team formation
- 💉 **Context Injection**: AI-powered prompt enhancement with expert knowledge
- 📊 **Analytics**: Performance tracking with collaborative filtering
- 🧠 **Hybrid Discovery**: Combined vector similarity and graph connectivity scoring
- 🐍 **Python-First**: Built with FastMCP v2 for clean, Pythonic code

## Installation

### Docker (Recommended for Production)

The easiest way to run the Expert Registry MCP server is using Docker:

```bash
# Build and deploy locally
./scripts/build.sh
./scripts/deploy.sh

# Or use pre-built image from GitHub Container Registry
docker pull ghcr.io/agentience/expert-registry-mcp:latest
```

**Features:**
- 🐳 Single container service for multiple MCP clients
- 📦 Expert contexts and registry mapped to host for easy editing
- 🔄 Hot reload support when files change on host
- 🌐 SSE transport for client connections
- 🗄️ Includes Neo4j database setup
- 🚀 Production-ready with health checks

See [DOCKER.md](DOCKER.md) for complete deployment guide.

### Local Development

Using uv (recommended):

```bash
# Create virtual environment and install
uv venv
uv pip install -e .

# Or install directly
uv pip install expert-registry-mcp
```

Using pip:

```bash
pip install expert-registry-mcp
```

### Database Setup

#### Vector Database (ChromaDB - Embedded)
```bash
# ChromaDB is embedded, no separate installation needed
# It will create a vector-db directory automatically
```

#### Graph Database (Neo4j)
```bash
# Option 1: Docker (recommended)
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Option 2: Local installation
# Download from https://neo4j.com/download/
```

## Quick Start

1. Set up your expert system directory structure:

```
expert-system/
├── registry/
│   └── expert-registry.json
├── expert-contexts/
│   ├── aws-amplify-gen2.md
│   ├── aws-cloudscape.md
│   └── ...
└── performance/
    └── metrics.json
```

2. Configure environment:

```bash
export EXPERT_SYSTEM_PATH=/path/to/expert-system
export NEO4J_URI=bolt://localhost:7687
export NEO4J_PASSWORD=password
```

3. Run the server:

```bash
# Using FastMCP CLI
fastmcp run expert-registry-mcp

# Or using Python
python -m expert_registry_mcp.server
```

## Claude Desktop Configuration

### Option 1: stdio Transport (Default)

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "expert-registry": {
      "command": "uv",
      "args": ["run", "expert-registry-mcp"],
      "env": {
        "EXPERT_SYSTEM_PATH": "/path/to/expert-system",
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_PASSWORD": "password"
      }
    }
  }
}
```

### Option 2: SSE Transport (Network-accessible)

First, start the server with SSE transport:

```bash
# Using command line
python -m expert_registry_mcp --transport sse --port 8080

# Or using convenience script
./scripts/run-mcp-sse.sh

# Or using Docker (runs on port 8080 by default)
./scripts/deploy.sh up
```

Then configure Claude Desktop to connect via SSE:

```json
{
  "mcpServers": {
    "expert-registry": {
      "transport": "sse",
      "url": "http://localhost:8080/sse"
    }
  }
}
```

### Remote Server Configuration

For connecting to a remote Expert Registry MCP server:

```json
{
  "mcpServers": {
    "expert-registry": {
      "transport": "sse",
      "url": "http://your-server.com:8080/sse"
    }
  }
}
```

### SSE Transport Benefits

- **Multiple Clients**: One server instance can handle multiple Claude Desktop clients
- **Remote Access**: Server can be accessed over the network
- **Resource Efficiency**: Shared caches and database connections
- **Centralized Management**: Single point for expert registry updates
- **Docker Ready**: Easily deployable with container orchestration

## Usage Examples

### Basic Expert Discovery

```python
# Detect technologies in your project
technologies = await expert_detect_technologies(
    scan_paths=["./src", "./package.json"]
)

# Select the best expert with hybrid search
result = await expert_smart_discover(
    context={
        "description": "Refactor authentication system using AWS Amplify",
        "technologies": technologies.technologies,
        "constraints": ["maintain backward compatibility"],
        "preferred_strategy": "single"
    }
)
```

### Context Injection

```python
# Load expert context
context = await expert_load_context(
    expert_id=result.expert.id
)

# Inject into prompt
enhanced_prompt = await expert_inject_context(
    prompt="Refactor the authentication system",
    expert_id=result.expert.id,
    injection_points=["constraints", "patterns", "quality-criteria"]
)
```

### Performance Tracking

```python
# Track usage
await expert_track_usage(
    expert_id=result.expert.id,
    task_id="auth-refactor-001",
    outcome={
        "success": True,
        "adherence_score": 9.5,
        "task_type": "refactoring"
    }
)

# Get analytics
analytics = await expert_get_analytics(
    expert_id=result.expert.id
)
```

## Available Tools

### Registry Management
- `expert_registry_list` - List experts with filtering
- `expert_registry_get` - Get expert details
- `expert_registry_search` - Search experts by query

### Expert Selection
- `expert_detect_technologies` - Detect project technologies
- `expert_select_optimal` - Select best expert for task
- `expert_assess_capability` - Assess expert capability
- `expert_smart_discover` - AI-powered hybrid search (vector + graph)

### Semantic Search
- `expert_semantic_search` - Search using natural language
- `expert_find_similar` - Find similar experts

### Graph Operations
- `expert_explore_network` - Explore expert relationships
- `expert_find_combinations` - Find complementary expert teams

### Context Operations
- `expert_load_context` - Load expert knowledge
- `expert_inject_context` - Enhance prompts with expertise

### Analytics
- `expert_track_usage` - Record expert performance
- `expert_get_analytics` - Get performance metrics

## Expert Registry Format

```json
{
  "version": "1.0.0",
  "last_updated": "2025-06-30T00:00:00Z",
  "experts": [
    {
      "id": "aws-amplify-gen2",
      "name": "AWS Amplify Gen 2 Expert",
      "version": "1.0.0",
      "description": "Expert in AWS Amplify Gen 2 development",
      "domains": ["backend", "cloud", "serverless"],
      "specializations": [
        {
          "technology": "AWS Amplify Gen 2",
          "frameworks": ["AWS CDK", "TypeScript"],
          "expertise_level": "expert"
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
        "Infrastructure as Code",
        "Serverless-first architecture"
      ],
      "quality_standards": [
        "100% type safety",
        "Comprehensive error handling"
      ]
    }
  ]
}
```

## Expert Context Format

Expert context files are markdown documents in `expert-contexts/`:

```markdown
# AWS Amplify Gen 2 Expert Context

## Constraints
- Use TypeScript for all backend code
- Follow AWS Well-Architected Framework principles
- Implement proper error handling and logging

## Patterns
- Infrastructure as Code using CDK
- Serverless-first architecture
- Event-driven communication

## Quality Standards
- 100% TypeScript type coverage
- Comprehensive error handling
- Unit test coverage > 80%
```

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/agentience/expert-registry-mcp
cd expert-registry-mcp

# Create virtual environment with uv
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install in development mode
uv pip install -e ".[dev]"
```

### Run Tests

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

## Architecture

### Multi-Layer Caching
- **Registry Cache**: 24-hour TTL for expert definitions
- **Vector Cache**: Embeddings cached until expert updates
- **Graph Cache**: Relationship queries cached for 10 minutes
- **Selection Cache**: 5-minute TTL for technology detection
- **Context Cache**: LRU cache for expert contexts (50 entries)

### Database Integration
- **ChromaDB**: Embedded vector database for semantic search
  - Multiple collections for different embedding types
  - Automatic embedding generation with sentence-transformers
- **Neo4j**: Graph database for relationship modeling
  - Expert-Technology-Task relationships
  - Team synergy calculations
  - Evolution tracking

### Performance Features
- **Vector Indices**: Annoy indices for ultra-fast similarity search
- **Precomputed Combinations**: Common expert pairs cached
- **Batch Operations**: Efficient bulk processing
- **Smart Invalidation**: Targeted cache updates

### File Watching
- Uses `watchdog` for cross-platform file monitoring
- Automatic registry reload and database sync
- No server restart required for updates

## Troubleshooting

### Common Issues

1. **Expert not found**
   - Verify expert ID in registry
   - Check file paths are correct
   - Ensure registry JSON is valid

2. **Context file missing**
   - Check expert-contexts directory
   - Verify filename matches expert ID
   - Ensure .md extension

3. **Cache not updating**
   - File watcher may need restart
   - Check file permissions
   - Verify EXPERT_SYSTEM_PATH

### Debug Mode

Enable debug logging:

```bash
export FASTMCP_DEBUG=1
expert-registry-mcp
```

## Advanced Features

### Semantic Search
The system uses ChromaDB to enable natural language queries:
```python
# Find experts by meaning, not just keywords
results = await expert_semantic_search(
    query="implement secure authentication with cloud integration",
    search_mode="hybrid"
)
```

### Relationship Exploration
Neo4j powers sophisticated relationship queries:
```python
# Explore expert networks
network = await expert_explore_network(
    start_expert_id="aws-amplify-gen2",
    depth=2,
    relationship_types=["SPECIALIZES_IN", "COMPATIBLE_WITH"]
)
```

### Team Formation
AI-powered team composition:
```python
# Find complementary expert teams
teams = await expert_find_combinations(
    requirements=["AWS Amplify", "React", "DynamoDB"],
    team_size=3
)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and linting
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://github.com/agentience/expert-registry-mcp
- Issues: https://github.com/agentience/expert-registry-mcp/issues
- Discussions: https://github.com/agentience/expert-registry-mcp/discussions