#!/bin/bash

# Expert Registry MCP - Local Deployment Script
# This script deploys the MCP server locally using Docker Compose

set -e

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="expert-registry-mcp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Expert Registry MCP Local Deployment ===${NC}"

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed or not in PATH${NC}"
    exit 1
fi

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Check if docker-compose.yml exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Error: $COMPOSE_FILE not found in $PROJECT_ROOT${NC}"
    exit 1
fi

# Parse command line arguments
COMMAND=${1:-"up"}
DETACH=""
INCLUDE_REDIS=""

case "$COMMAND" in
    "up")
        echo -e "${BLUE}Starting Expert Registry MCP services...${NC}"
        DETACH="-d"
        ;;
    "up-fg")
        echo -e "${BLUE}Starting Expert Registry MCP services in foreground...${NC}"
        COMMAND="up"
        ;;
    "down")
        echo -e "${YELLOW}Stopping Expert Registry MCP services...${NC}"
        ;;
    "restart")
        echo -e "${YELLOW}Restarting Expert Registry MCP services...${NC}"
        ;;
    "logs")
        echo -e "${BLUE}Showing Expert Registry MCP logs...${NC}"
        ;;
    "build")
        echo -e "${BLUE}Building Expert Registry MCP services...${NC}"
        ;;
    "with-redis")
        echo -e "${BLUE}Starting Expert Registry MCP services with Redis...${NC}"
        COMMAND="up"
        DETACH="-d"
        INCLUDE_REDIS="--profile with-redis"
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 [up|up-fg|down|restart|logs|build|with-redis]${NC}"
        echo -e "${YELLOW}  up        - Start services in background (default)${NC}"
        echo -e "${YELLOW}  up-fg     - Start services in foreground${NC}"
        echo -e "${YELLOW}  down      - Stop services${NC}"
        echo -e "${YELLOW}  restart   - Restart services${NC}"
        echo -e "${YELLOW}  logs      - Show service logs${NC}"
        echo -e "${YELLOW}  build     - Build services${NC}"
        echo -e "${YELLOW}  with-redis- Start with Redis caching${NC}"
        exit 0
        ;;
esac

# Create necessary directories if they don't exist
echo -e "${BLUE}Ensuring required directories exist...${NC}"
mkdir -p expert-system/registry
mkdir -p expert-system/expert-contexts
mkdir -p expert-system/vector-db
mkdir -p chroma_db
mkdir -p config

# Set proper permissions
chmod -R 755 expert-system/
chmod -R 755 chroma_db/

# Execute the Docker Compose command
echo -e "${BLUE}Executing: $COMPOSE_CMD $COMMAND $DETACH $INCLUDE_REDIS${NC}"

case "$COMMAND" in
    "up")
        $COMPOSE_CMD $COMMAND $DETACH $INCLUDE_REDIS
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Expert Registry MCP services started successfully${NC}"
            echo -e "${BLUE}Services available:${NC}"
            echo -e "  • MCP Server: expert-registry-mcp (container) - Port 8080"
            echo -e "  • Neo4j Database: External at 192.168.2.174:7687"
            if [ -n "$INCLUDE_REDIS" ]; then
                echo -e "  • Redis Cache: localhost:6379"
            fi
            echo -e "${YELLOW}Use 'docker logs expert-registry-mcp' to view MCP server logs${NC}"
            echo -e "${YELLOW}Use '$0 down' to stop services${NC}"
        else
            echo -e "${RED}✗ Failed to start services${NC}"
            exit 1
        fi
        ;;
    "down")
        $COMPOSE_CMD down
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Expert Registry MCP services stopped${NC}"
        else
            echo -e "${RED}✗ Failed to stop services${NC}"
            exit 1
        fi
        ;;
    "restart")
        $COMPOSE_CMD restart
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Expert Registry MCP services restarted${NC}"
        else
            echo -e "${RED}✗ Failed to restart services${NC}"
            exit 1
        fi
        ;;
    "logs")
        $COMPOSE_CMD logs -f
        ;;
    "build")
        $COMPOSE_CMD build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Expert Registry MCP services built successfully${NC}"
        else
            echo -e "${RED}✗ Failed to build services${NC}"
            exit 1
        fi
        ;;
esac