# Development Setup Guide

**Last Updated: 2025-07-01**

## Neo4j Configuration

The Expert Registry Admin Interface connects to a Neo4j instance for graph database operations.

### Connection Details
- **Bolt Protocol**: `bolt://192.168.2.174:7687`
- **HTTP Browser**: `http://192.168.2.174:7474`
- **Credentials**: 
  - Username: `neo4j`
  - Password: `neo4agentience`

## Starting the Admin Interface

### Prerequisites
1. Ensure Neo4j is running at the specified address
2. Python 3.11+ installed
3. Node.js 20+ installed

### Quick Start
```bash
# From project root
./scripts/run-admin.sh
```

This will:
1. Check Neo4j connectivity
2. Load environment variables from `.env.development`
3. Start the FastAPI backend server
4. Start the React development server

### Manual Setup

#### Backend Server
```bash
# Load environment variables
export $(cat .env.development | grep -v '^#' | xargs)

# Activate virtual environment
source .venv/bin/activate

# Start FastAPI server
python -m expert_registry_mcp.fastapi_server
```

#### Frontend Development Server
```bash
cd admin-ui
npm install  # First time only
npm run dev
```

## Access Points

- **Admin UI**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Neo4j Browser**: http://192.168.2.174:7474

## Environment Variables

### Backend (.env.development)
```env
NEO4J_URI=bolt://192.168.2.174:7687
NEO4J_PASSWORD=neo4agentience
ADMIN_API_HOST=0.0.0.0
ADMIN_API_PORT=8000
EXPERT_SYSTEM_PATH=./expert-system
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### Frontend (admin-ui/.env.development)
```env
VITE_API_URL=http://localhost:8000/api/admin
VITE_NEO4J_BROWSER_URL=http://192.168.2.174:7474
```

## Testing the Connection

1. Verify Neo4j is accessible:
```bash
nc -zv 192.168.2.174 7687
```

2. Test Neo4j connection:
```bash
curl -u neo4j:neo4agentience http://192.168.2.174:7474/db/data/
```

3. Check API health:
```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Neo4j Connection Issues
- Ensure Neo4j is running and accessible at the specified IP
- Check firewall settings allow connections on ports 7687 and 7474
- Verify credentials are correct

### API Server Issues
- Check Python virtual environment is activated
- Ensure all dependencies are installed: `pip install -e .`
- Check logs for any import or connection errors

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check browser console for API connection errors