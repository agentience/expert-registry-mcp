#!/bin/bash

# Expert Registry MCP - Cleanup Script
# This script cleans up Docker resources for the Expert Registry MCP

set -e

# Configuration
PROJECT_NAME="expert-registry-mcp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Expert Registry MCP Cleanup ===${NC}"

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${YELLOW}Stopping and removing containers...${NC}"
$COMPOSE_CMD down

echo -e "${YELLOW}Removing Docker volumes...${NC}"
$COMPOSE_CMD down -v

echo -e "${YELLOW}Removing Docker images...${NC}"
docker rmi expert-registry-mcp:latest 2>/dev/null || echo "Image not found, skipping..."

echo -e "${YELLOW}Removing Docker network...${NC}"
docker network rm expert-registry-network 2>/dev/null || echo "Network not found, skipping..."

echo -e "${YELLOW}Pruning unused Docker resources...${NC}"
docker system prune -f

echo -e "${GREEN}✓ Expert Registry MCP cleanup complete${NC}"
echo -e "${YELLOW}Note: Host volumes (./expert-system, ./chroma_db) were preserved${NC}"
echo -e "${YELLOW}Use 'rm -rf expert-system chroma_db' to remove data volumes if needed${NC}"