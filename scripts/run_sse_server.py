#!/usr/bin/env python3
"""Run Expert Registry MCP Server with SSE Transport."""

import os
import sys
import subprocess
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def main():
    """Run the MCP server with SSE transport."""
    # Default configuration
    host = os.getenv("MCP_SSE_HOST", "0.0.0.0")
    port = os.getenv("MCP_SSE_PORT", "8080")
    
    # Set required environment variables
    os.environ.setdefault("EXPERT_SYSTEM_PATH", "./expert-system")
    os.environ.setdefault("NEO4J_URI", "bolt://192.168.2.174:7687")
    os.environ.setdefault("NEO4J_PASSWORD", "neo4agentience")
    
    print(f"🚀 Starting Expert Registry MCP Server with SSE Transport")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Server will be available at: http://{host}:{port}")
    print("Press Ctrl+C to stop\n")
    
    # Run the server
    cmd = [
        sys.executable, "-m", "expert_registry_mcp",
        "--transport", "sse",
        "--host", host,
        "--port", port
    ]
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()