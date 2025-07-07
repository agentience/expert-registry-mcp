"""FastAPI server for Expert Registry Admin API."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.development
load_dotenv(".env.development")
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .admin_api import router as admin_router

# Create FastAPI app
app = FastAPI(
    title="Expert Registry Admin API",
    description="Administrative API for Expert Registry MCP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",  # Current UI port
        "http://localhost:3002",  # Vite dev server default
        "http://localhost:5173",  # Vite alternative port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount admin API routes
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])

# Serve static files if admin UI is built
admin_ui_path = Path(__file__).parent.parent.parent / "admin-ui" / "dist"
if admin_ui_path.exists():
    app.mount("/admin", StaticFiles(directory=str(admin_ui_path), html=True), name="admin")
    
    # Serve index.html for SPA routing
    @app.get("/admin/{path:path}")
    async def serve_admin_spa(path: str):
        return FileResponse(str(admin_ui_path / "index.html"))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "expert-registry-admin"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Expert Registry Admin API",
        "version": "1.0.0",
        "endpoints": {
            "admin_ui": "/admin",
            "api_docs": "/docs",
            "health": "/health"
        }
    }

def run_server():
    """Run the FastAPI server."""
    host = os.getenv("ADMIN_API_HOST", "0.0.0.0")
    port = int(os.getenv("ADMIN_API_PORT", "8000"))
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    run_server()