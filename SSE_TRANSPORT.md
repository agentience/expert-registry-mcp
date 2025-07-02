# Running Expert Registry MCP with SSE Transport

**Last Updated: 2025-07-02**

## Overview

The Expert Registry MCP server supports both stdio and SSE (Server-Sent Events) transport modes. SSE transport allows the server to run as a standalone HTTP service that clients can connect to over the network.

## Running with SSE Transport

### Method 1: Using Command Line Arguments

```bash
# Run with default settings (host: 0.0.0.0, port: 8000)
python -m expert_registry_mcp --transport sse

# Run with custom host and port
python -m expert_registry_mcp --transport sse --host 127.0.0.1 --port 8080
```

### Method 2: Using the Convenience Script

```bash
# Run with default settings
./scripts/run-mcp-sse.sh

# Run with custom host and port
./scripts/run-mcp-sse.sh 127.0.0.1 8080
```

### Method 3: Using Python Script (Cross-platform)

```bash
# Run with default settings
python scripts/run_sse_server.py

# Set custom host/port via environment variables
export MCP_SSE_HOST=127.0.0.1
export MCP_SSE_PORT=8080
python scripts/run_sse_server.py
```

### Method 4: Using Docker

```bash
# The Docker container runs with SSE transport by default
./scripts/deploy.sh up

# The server will be available at http://localhost:8080
```

## Configuration

### Environment Variables

- `MCP_SSE_HOST`: Host to bind to (default: 0.0.0.0)
- `MCP_SSE_PORT`: Port to bind to (default: 8080 for local, 8000 for Docker)
- `EXPERT_SYSTEM_PATH`: Path to expert system data
- `NEO4J_URI`: Neo4j connection URI
- `NEO4J_PASSWORD`: Neo4j password

### Default Ports

- **Local Development**: Port 8080 (to avoid conflict with Admin API on 8000)
- **Docker Container**: Port 8000 (mapped to host port 8080)

## Connecting to SSE Server

Once the server is running with SSE transport, clients can connect to:

```
http://<host>:<port>
```

For example:
- Local: `http://localhost:8080`
- Docker: `http://localhost:8080`
- Network: `http://192.168.1.100:8080`

## Health Check

You can verify the server is running by accessing the health endpoint:

```bash
curl http://localhost:8080/health
```

## Comparison: stdio vs SSE

### stdio Transport
- **Use Case**: Direct integration with tools that spawn the process
- **Connection**: Process pipes (stdin/stdout)
- **Scaling**: One instance per client
- **Network**: Not accessible over network

### SSE Transport
- **Use Case**: Network-accessible service
- **Connection**: HTTP/SSE
- **Scaling**: Multiple clients can connect to one instance
- **Network**: Accessible from any network location

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. Check what's using the port:
   ```bash
   lsof -i :8080
   ```

2. Either stop the conflicting service or use a different port:
   ```bash
   python -m expert_registry_mcp --transport sse --port 8081
   ```

### Connection Refused

If clients can't connect:

1. Verify the server is running:
   ```bash
   ps aux | grep expert_registry_mcp
   ```

2. Check firewall settings allow the port

3. If using Docker, ensure port mapping is correct:
   ```bash
   docker ps
   ```

### SSE Connection Drops

SSE connections may drop due to:
- Network timeouts
- Proxy configurations
- Client-side connection limits

Configure your reverse proxy (if using one) to support SSE:
```nginx
# Nginx example
location /events {
    proxy_pass http://localhost:8080;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off;
    proxy_cache off;
}
```