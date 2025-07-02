# Multi-stage build for Expert Registry MCP Server
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_CACHE_DIR=/tmp/uv-cache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
RUN pip install uv

# Set work directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev --no-install-project

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EXPERT_SYSTEM_PATH=/app/expert-system \
    EMBEDDING_MODEL=all-MiniLM-L6-v2 \
    NEO4J_URI=bolt://localhost:7687 \
    NEO4J_PASSWORD=password

# Install system dependencies for runtime
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mcp && useradd -r -g mcp -s /bin/bash mcp

# Set work directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Make sure the virtual environment is activated
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY src/ ./src/
COPY pyproject.toml README.md ./

# Install the package in editable mode
RUN pip install -e .

# Create directories for expert system data with proper permissions
RUN mkdir -p /app/expert-system/registry \
             /app/expert-system/expert-contexts \
             /app/expert-system/vector-db \
             /app/chroma_db \
    && chown -R mcp:mcp /app

# Copy default expert system files
COPY expert-system/ /app/expert-system/
RUN chown -R mcp:mcp /app/expert-system

# Switch to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import expert_registry_mcp.server; print('healthy')" || exit 1

# Expose port for SSE transport
EXPOSE 8000

# Default command to run the MCP server with SSE transport
# Note: For SSE transport, clients connect to the server process
# Use environment variables to control transport type
CMD ["python", "-m", "expert_registry_mcp", "--transport", "sse", "--host", "0.0.0.0", "--port", "8000"]