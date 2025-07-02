# Neo4j Configuration for Expert Registry MCP

**Last Updated: 2025-07-01**

## Overview

Both the MCP server (deployed via Docker) and the Admin API server now connect to the same external Neo4j instance.

## Neo4j Connection Details

- **Host**: 192.168.2.174
- **Bolt Port**: 7687
- **HTTP Port**: 7474 (for Neo4j Browser)
- **Username**: neo4j
- **Password**: neo4agentience

## Configuration Files

### 1. Admin API Configuration
- **File**: `.env.development`
- **Variables**:
  ```
  NEO4J_URI=bolt://192.168.2.174:7687
  NEO4J_PASSWORD=neo4agentience
  ```

### 2. Docker MCP Server Configuration
- **File**: `config/docker.env`
- **Variables**:
  ```
  NEO4J_URI=bolt://192.168.2.174:7687
  NEO4J_PASSWORD=neo4agentience
  ```

### 3. Docker Compose Configuration
- **File**: `docker-compose.yml`
- Uses `config/docker.env` for environment variables
- No longer includes a local Neo4j container
- MCP server exposed on port 8080 (to avoid conflict with Admin API on 8000)

## Changes Made

1. **Removed Local Neo4j Container**: The docker-compose.yml no longer includes a Neo4j service
2. **Updated Connection Strings**: Both servers now point to the external Neo4j at 192.168.2.174
3. **Port Adjustment**: MCP server moved to port 8080 to avoid conflict with Admin API
4. **Centralized Configuration**: Using config/docker.env for consistent environment variables

## Verification

To verify both servers are using the same Neo4j instance:

1. **Check Admin API Connection**:
   ```bash
   # With admin server running
   curl http://localhost:8000/api/admin/stats/overview
   ```

2. **Check MCP Server Connection** (after deployment):
   ```bash
   ./scripts/deploy.sh up
   docker logs expert-registry-mcp
   ```

3. **View Neo4j Browser**:
   - Navigate to http://192.168.2.174:7474
   - Login with neo4j/neo4agentience
   - Check for expert nodes and relationships

## Deployment

To deploy the MCP server with the correct Neo4j configuration:

```bash
# Build and start the MCP server
./scripts/deploy.sh up

# View logs
./scripts/deploy.sh logs

# Stop the server
./scripts/deploy.sh down
```

The MCP server will now connect to the same Neo4j instance as the Admin API, ensuring data consistency.