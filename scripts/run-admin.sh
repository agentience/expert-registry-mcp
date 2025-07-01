#!/bin/bash

# Script to build and run the Expert Registry Admin Interface

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Starting Expert Registry Admin Interface..."

# Check if we should use Docker or local development
if [ "$1" == "docker" ]; then
    echo "📦 Building Docker image with admin UI..."
    docker build -f Dockerfile.admin -t expert-registry-admin:latest .
    
    echo "🐳 Starting services with docker-compose..."
    docker-compose -f docker-compose.admin.yml up -d
    
    echo "✅ Admin interface available at http://localhost:8000/admin"
    echo "📊 API documentation available at http://localhost:8000/docs"
else
    echo "💻 Starting local development servers..."
    
    # Function to find a free port starting from a given port
    find_free_port() {
        local start_port=$1
        local max_attempts=${2:-10}
        local port=$start_port
        
        for ((i=0; i<max_attempts; i++)); do
            if ! lsof -i :$port | grep LISTEN >/dev/null 2>&1; then
                echo $port
                return 0
            fi
            port=$((port + 1))
        done
        
        echo "Could not find a free port starting from $start_port after $max_attempts attempts" >&2
        return 1
    }
    
    # Find free ports for both services
    echo "🔍 Finding available ports..."
    
    API_PORT=$(find_free_port 8000)
    if [ $? -ne 0 ]; then
        echo "❌ Could not find a free port for the API server"
        exit 1
    fi
    
    VITE_PORT=$(find_free_port 3000)
    if [ $? -ne 0 ]; then
        echo "❌ Could not find a free port for the admin UI"
        exit 1
    fi
    
    if [ "$API_PORT" != "8000" ]; then
        echo "📋 API server will use port $API_PORT (8000 was in use)"
    fi
    
    if [ "$VITE_PORT" != "3000" ]; then
        echo "📋 Admin UI will use port $VITE_PORT (3000 was in use)"
    fi
    
    # Check if Neo4j is running at specified address
    if ! nc -z 192.168.2.174 7687 2>/dev/null; then
        echo "⚠️  Neo4j not detected at 192.168.2.174:7687"
        echo "Please ensure Neo4j is running at:"
        echo "  - Bolt: 192.168.2.174:7687"
        echo "  - HTTP: 192.168.2.174:7474"
        echo "  - Credentials: neo4j/neo4agentience"
        exit 1
    fi
    
    # Load development environment and override ports
    if [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    fi
    
    # Override API port in environment
    export ADMIN_API_PORT=$API_PORT
    
    # Start FastAPI server in background
    echo "🔧 Starting FastAPI server..."
    cd "$PROJECT_ROOT"
    
    # Check if uv is available
    if ! command -v uv &> /dev/null; then
        echo "❌ uv is not installed. Please install uv first:"
        echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    
    # Sync dependencies with uv
    echo "📦 Syncing dependencies with uv..."
    uv sync
    
    # Start FastAPI server using uv
    uv run python -m expert_registry_mcp.fastapi_server &
    FASTAPI_PID=$!
    
    # Wait for FastAPI server to start
    echo "Waiting for FastAPI server to start on port $API_PORT..."
    for i in {1..30}; do
        if curl -s http://localhost:$API_PORT/health > /dev/null 2>&1; then
            echo "✅ FastAPI server is ready on port $API_PORT!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ FastAPI server failed to start after 30 seconds"
            kill $FASTAPI_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
    
    # Start admin UI development server
    echo "🎨 Starting admin UI development server on port $VITE_PORT..."
    cd "$PROJECT_ROOT/admin-ui"
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing admin UI dependencies..."
        npm install
    fi
    
    # Set environment variables for Vite and start dev server
    export PORT=$VITE_PORT
    export VITE_API_URL="http://localhost:$API_PORT"
    npm run dev -- --port $VITE_PORT &
    VITE_PID=$!
    
    echo ""
    echo "✅ Services started successfully!"
    echo "🌐 Admin UI: http://localhost:$VITE_PORT"
    echo "📡 API: http://localhost:$API_PORT"
    echo "📊 API Docs: http://localhost:$API_PORT/docs"
    echo "🔍 Neo4j Browser: http://192.168.2.174:7474"
    echo ""
    echo "Press Ctrl+C to stop all services..."
    
    # Enhanced cleanup function
    cleanup() {
        echo ""
        echo "🛝 Stopping services..."
        
        if [ ! -z "$FASTAPI_PID" ]; then
            echo "Stopping FastAPI server (PID: $FASTAPI_PID)..."
            kill $FASTAPI_PID 2>/dev/null || true
            wait $FASTAPI_PID 2>/dev/null || true
        fi
        
        if [ ! -z "$VITE_PID" ]; then
            echo "Stopping Vite dev server (PID: $VITE_PID)..."
            kill $VITE_PID 2>/dev/null || true
            wait $VITE_PID 2>/dev/null || true
        fi
        
        echo "✅ All services stopped."
        exit 0
    }
    
    # Set up interrupt handling
    trap cleanup INT TERM
    
    # Wait for interrupt
    wait
fi