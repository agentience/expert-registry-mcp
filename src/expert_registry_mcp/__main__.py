"""Main module entry point for expert_registry_mcp."""

import os
import warnings
import logging

# Disable ChromaDB telemetry before import
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_IMPL"] = "None"

# Suppress ChromaDB telemetry errors
logging.getLogger("chromadb.telemetry").setLevel(logging.ERROR)

# Suppress Pydantic deprecation warnings temporarily
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pydantic")

from .server import main

if __name__ == "__main__":
    main()