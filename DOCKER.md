# Expert Registry MCP - Docker Deployment Guide

**Last Updated: 2025-06-30**

This guide covers deploying the Expert Registry MCP server in Docker containers for both local development and production environments.

## Overview

The Expert Registry MCP server is designed to run in Docker containers with:
- **Volume mapping** for easy editing of expert files on the host
- **Single service** accessible to multiple MCP clients via SSE transport
- **Local development** with quick build/deploy scripts
- **Production deployment** to GitHub Container Registry

## Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- 4GB+ RAM available for containers
- 2GB+ disk space for images and volumes

### Local Development

1. **Build the container**:
   ```bash
   ./scripts/build.sh
   ```

2. **Deploy locally**:
   ```bash
   ./scripts/deploy.sh
   ```

3. **Access services**:
   - MCP Server: Available via SSE transport (stdio/transport in container)
   - Neo4j Database: http://localhost:7474 (neo4j/expertregistry)
   - Expert Files: Edit directly in `./expert-system/` on host (auto-reloads)

4. **Stop services**:
   ```bash
   ./scripts/deploy.sh down
   ```

## Architecture

### Container Structure

```
┌─────────────────────────────────────────┐
│ expert-registry-mcp Container           │
├─────────────────────────────────────────┤
│ • Python 3.11 + FastMCP                │
│ • Expert Registry MCP Server            │
│ • Vector/Graph DB clients               │
│ • Mounted volumes:                      │
│   - /app/expert-system → ./expert-system│
│   - /app/chroma_db → ./chroma_db        │
└─────────────────────────────────────────┘
           │ Network: expert-registry-network
           ▼
┌─────────────────────────────────────────┐
│ neo4j Container                         │
├─────────────────────────────────────────┤
│ • Neo4j 5.15 Community                 │
│ • Graph database for expert relations  │
│ • Ports: 7474 (HTTP), 7687 (Bolt)     │
│ • Persistent volumes for data          │
└─────────────────────────────────────────┘
```

### Volume Mapping

The container uses host volume mapping for easy file editing and persistence:

| Container Path | Host Path | Purpose |
|---|---|---|
| `/app/expert-system` | `./expert-system/` | Expert contexts and registry (editable on host) |
| `/app/chroma_db` | `./chroma_db/` | Vector database storage |
| `/app/config` | `./config/` | Custom configurations |

**Benefits:**
- **Direct editing**: Modify expert files on host with any editor
- **Hot reload**: Container automatically detects file changes
- **Version control**: Expert files can be committed to git
- **Backup**: Easy backup of expert data on host filesystem

## Deployment Scripts

### build.sh

Builds the Docker image locally:

```bash
./scripts/build.sh
```

**Features**:
- Multi-stage build for optimized image size
- Build verification and image information
- Error handling and colored output

### deploy.sh

Manages local container deployment:

```bash
# Start in background (default)
./scripts/deploy.sh

# Start in foreground
./scripts/deploy.sh up-fg

# Start with Redis caching
./scripts/deploy.sh with-redis

# Stop services
./scripts/deploy.sh down

# Restart services
./scripts/deploy.sh restart

# View logs
./scripts/deploy.sh logs

# Rebuild services
./scripts/deploy.sh build
```

### cleanup.sh

Complete cleanup of Docker resources:

```bash
./scripts/cleanup.sh
```

**Removes**:
- All containers and networks
- Docker images
- Docker volumes (database data)
- **Preserves**: Host volumes (`./expert-system`, `./chroma_db`)

## Configuration

### Environment Variables

Key configuration options (see `config/docker.env`):

| Variable | Default | Description |
|---|---|---|
| `EXPERT_SYSTEM_PATH` | `/app/expert-system` | Expert data directory |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `NEO4J_URI` | `bolt://neo4j:7687` | Neo4j connection string |
| `NEO4J_PASSWORD` | `expertregistry` | Neo4j database password |

### Custom Configuration

1. **Copy environment template**:
   ```bash
   cp config/docker.env .env
   ```

2. **Modify settings** in `.env` file

3. **Reference in docker-compose.yml**:
   ```yaml
   env_file:
     - .env
   ```

## Volume Management

### Expert System Data

The expert system data is mapped to host volumes for:
- **Easy editing**: Modify expert files directly on host with any editor
- **Hot reload**: Container detects changes and reloads automatically  
- **Version control**: Expert files can be committed to source control
- **Persistence**: Data survives container restarts
- **Backup**: Easy backup of host directories

### Default Data Initialization

On first run, the container copies default expert system data:

```bash
# Default structure created automatically
expert-system/
├── registry/
│   └── expert-registry.json
└── expert-contexts/
    ├── expert-amplify.md
    ├── expert-cloudscape.md
    └── expert-dynamodb.md
```

### Volume Permissions

The container runs as user `mcp` (non-root) and requires proper permissions:

```bash
# Set ownership (if needed)
sudo chown -R 1000:1000 expert-system/
sudo chown -R 1000:1000 chroma_db/

# Or use current user permissions
chmod -R 755 expert-system/
chmod -R 755 chroma_db/
```

## Network Configuration

### Container Network

Services communicate on the `expert-registry-network` bridge network:

- **expert-registry-mcp**: MCP server container
- **neo4j**: Graph database
- **redis** (optional): Caching layer

### Port Mapping

| Service | Container Port | Host Port | Purpose |
|---|---|---|---|
| MCP Server | 8000 | 8000 | Health checks/debugging |
| Neo4j HTTP | 7474 | 7474 | Web interface |
| Neo4j Bolt | 7687 | 7687 | Database protocol |
| Redis | 6379 | 6379 | Cache access (optional) |

## Production Deployment

### GitHub Container Registry

The project includes GitHub Actions workflows for automated builds:

1. **Container publishing** (`docker-publish.yml`):
   - Builds on push to main/develop
   - Publishes to `ghcr.io/agentience/expert-registry-mcp`
   - Multi-architecture support (amd64/arm64)
   - Security scanning with Trivy

2. **Integration testing** (`docker-test.yml`):
   - Tests container functionality
   - Validates docker-compose setup
   - Ensures database connectivity

### Using Published Images

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/agentience/expert-registry-mcp:latest

# Use in docker-compose.yml
services:
  expert-registry-mcp:
    image: ghcr.io/agentience/expert-registry-mcp:latest
    # ... rest of configuration
```

### Production docker-compose

```yaml
version: '3.8'
services:
  expert-registry-mcp:
    image: ghcr.io/agentience/expert-registry-mcp:latest
    restart: unless-stopped
    environment:
      - EXPERT_SYSTEM_PATH=/app/expert-system
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
    volumes:
      - /opt/expert-system:/app/expert-system:rw
      - /opt/chroma_db:/app/chroma_db:rw
    depends_on:
      neo4j:
        condition: service_healthy
```

## Multi-Client Architecture

### Single Service Design

The Expert Registry MCP server runs as a single container that multiple MCP clients connect to:

```bash
# Single MCP server container
docker run -p 8000:8000 \
  -v ./expert-system:/app/expert-system \
  expert-registry-mcp

# Multiple clients connect via MCP transport
# Client 1: connects to server via SSE/stdio
# Client 2: connects to same server instance  
# Client N: all share the same expert registry
```

### Production Scaling

For high-availability deployments:

1. **Single MCP server** with load balancer in front
2. **Multiple client connections** to same server instance
3. **Shared database** (Neo4j for relationships)
4. **Host-mounted volumes** for expert file editing

### Client Connection

MCP clients connect to the containerized server using the standard MCP transport protocols:

```json
{
  "mcpServers": {
    "expert-registry": {
      "command": "docker",
      "args": ["exec", "-i", "expert-registry-mcp", "expert-registry-mcp"],
      "env": {
        "EXPERT_SYSTEM_PATH": "/app/expert-system"
      }
    }
  }
}
```

**Alternative - SSE Transport** (if supported by client):
```json
{
  "mcpServers": {
    "expert-registry": {
      "command": "stdio",
      "args": ["http://localhost:8000/sse"]
    }
  }
}
```

## Monitoring and Health Checks

### Container Health

The Dockerfile includes health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

### Service Monitoring

```bash
# Check container status
docker ps

# View container logs
docker logs expert-registry-mcp -f

# Check resource usage
docker stats expert-registry-mcp

# Inspect container details
docker inspect expert-registry-mcp
```

### Database Health

```bash
# Neo4j health check
docker exec expert-registry-neo4j \
  cypher-shell -u neo4j -p expertregistry "RETURN 'healthy' as status"

# Check Neo4j web interface
curl http://localhost:7474
```

## Troubleshooting

### Common Issues

1. **Permission errors**:
   ```bash
   # Fix volume permissions
   chmod -R 755 expert-system/ chroma_db/
   ```

2. **Port conflicts**:
   ```bash
   # Check for conflicting services
   netstat -tuln | grep -E "(7474|7687|8000)"
   ```

3. **Database connection failures**:
   ```bash
   # Check Neo4j container logs
   docker logs expert-registry-neo4j
   
   # Test database connectivity
   docker exec expert-registry-mcp \
     python -c "from neo4j import GraphDatabase; print('Connected!')"
   ```

4. **Container startup failures**:
   ```bash
   # Check MCP container logs
   docker logs expert-registry-mcp
   
   # Test Python imports
   docker exec expert-registry-mcp \
     python -c "import expert_registry_mcp; print('Import OK')"
   ```

### Log Analysis

```bash
# Follow all service logs
docker-compose logs -f

# Filter for specific service
docker-compose logs -f expert-registry-mcp

# Check for errors
docker-compose logs | grep -i error
```

### Data Recovery

```bash
# Backup expert data
tar -czf expert-system-backup.tar.gz expert-system/

# Restore expert data
tar -xzf expert-system-backup.tar.gz

# Reset databases (destructive)
./scripts/cleanup.sh
./scripts/deploy.sh
```

## Security Considerations

### Container Security

- **Non-root user**: Container runs as `mcp` user
- **Read-only filesystem**: Application files are read-only
- **Minimal base image**: Uses `python:3.11-slim`
- **Security scanning**: Trivy scans in CI/CD

### Network Security

```yaml
# Production network isolation
networks:
  expert-registry:
    internal: true
  proxy:
    external: true
```

### Secrets Management

```bash
# Use Docker secrets for production
echo "secure_password" | docker secret create neo4j_password -

# Reference in compose
services:
  neo4j:
    secrets:
      - neo4j_password
```

## Performance Optimization

### Resource Limits

```yaml
services:
  expert-registry-mcp:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### Volume Performance

```yaml
# Use tmpfs for temporary data
tmpfs:
  - /tmp
  - /var/tmp

# Optimize volume options
volumes:
  - ./expert-system:/app/expert-system:rw,cached
```

## Development Workflow

### Container Development

1. **Make changes** to source code
2. **Rebuild container**: `./scripts/build.sh`
3. **Restart services**: `./scripts/deploy.sh restart`
4. **Test changes**: View logs and test functionality

### Live Development

```yaml
# Mount source code for live development
volumes:
  - ./src:/app/src:rw
  - ./expert-system:/app/expert-system:rw
```

### Debugging

```bash
# Run container interactively
docker run -it --rm \
  -v $(pwd)/expert-system:/app/expert-system \
  expert-registry-mcp:latest bash

# Execute commands in running container
docker exec -it expert-registry-mcp bash
```

## Support

For issues with container deployment:

1. **Check logs**: `docker-compose logs`
2. **Verify volumes**: `ls -la expert-system/`
3. **Test connectivity**: Database and network tests
4. **Review configuration**: Environment variables and compose file
5. **GitHub Issues**: Report bugs and request features