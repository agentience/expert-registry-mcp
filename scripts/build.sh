#!/bin/bash

# Expert Registry MCP - Docker Build Script
# This script builds the Docker image for local development

set -e

# Configuration
IMAGE_NAME="expert-registry-mcp"
IMAGE_TAG="latest"
DOCKERFILE="Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Expert Registry MCP Docker Build ===${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running or not accessible${NC}"
    exit 1
fi

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}Building image: $IMAGE_NAME:$IMAGE_TAG${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}Error: $DOCKERFILE not found in $PROJECT_ROOT${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build \
    --tag "$IMAGE_NAME:$IMAGE_TAG" \
    --file "$DOCKERFILE" \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully: $IMAGE_NAME:$IMAGE_TAG${NC}"
    
    # Show image info
    echo -e "${BLUE}Image details:${NC}"
    docker images "$IMAGE_NAME:$IMAGE_TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo -e "${GREEN}✓ Build complete! Use './scripts/deploy.sh' to deploy locally${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi