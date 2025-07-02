#!/bin/bash

# Run Expert Registry MCP Server with SSE Transport

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_HOST="0.0.0.0"
DEFAULT_PORT="8080"

# Parse command line arguments
HOST="${1:-$DEFAULT_HOST}"
PORT="${2:-$DEFAULT_PORT}"

echo -e "${GREEN}🚀 Starting Expert Registry MCP Server with SSE Transport${NC}"
echo -e "${YELLOW}Host: $HOST${NC}"
echo -e "${YELLOW}Port: $PORT${NC}"
echo ""

# Set environment variables
export EXPERT_SYSTEM_PATH="${EXPERT_SYSTEM_PATH:-./expert-system}"
export NEO4J_URI="${NEO4J_URI:-bolt://192.168.2.174:7687}"
export NEO4J_PASSWORD="${NEO4J_PASSWORD:-neo4agentience}"

# Check if virtual environment exists
if [ -d ".venv" ]; then
    echo -e "${GREEN}✓ Using existing virtual environment${NC}"
else
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    uv venv
fi

# Install/update dependencies
echo -e "${YELLOW}Ensuring dependencies are up to date...${NC}"
uv pip install -e ".[dev]" --quiet

# Run the server with SSE transport
echo -e "${GREEN}Starting server...${NC}"
echo -e "${YELLOW}Server will be available at: http://$HOST:$PORT${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

python -m expert_registry_mcp --transport sse --host "$HOST" --port "$PORT"