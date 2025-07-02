"""Vector database integration using ChromaDB for semantic search."""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import logging
from datetime import datetime

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import numpy as np
from cachetools import TTLCache

from .models import Expert, ExpertEmbedding

logger = logging.getLogger(__name__)


class VectorDatabaseManager:
    """Manage vector database operations with ChromaDB."""
    
    def __init__(
        self,
        persist_path: Optional[Path] = None,
        embedding_model: str = "all-MiniLM-L6-v2",
        cache_ttl: int = 3600
    ):
        # Set up persistence path
        self.persist_path = persist_path or Path("./chroma_db")
        self.persist_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB client with telemetry disabled
        os.environ["ANONYMIZED_TELEMETRY"] = "False"
        self.client = chromadb.PersistentClient(
            path=str(self.persist_path),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
                is_persistent=True
            )
        )
        
        # Set up embedding function
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=embedding_model
        )
        
        # Initialize collections
        self.collections = {}
        self._init_collections()
        
        # Cache for embeddings
        self.embedding_cache = TTLCache(maxsize=1000, ttl=cache_ttl)
        
    def _init_collections(self):
        """Initialize vector collections."""
        collection_names = [
            "expert-descriptions",
            "expert-patterns",
            "expert-constraints",
            "expert-technologies",
            "task-history"
        ]
        
        for name in collection_names:
            try:
                self.collections[name] = self.client.get_or_create_collection(
                    name=name,
                    embedding_function=self.embedding_function,
                    metadata={"hnsw:space": "cosine"}
                )
            except Exception as e:
                logger.error(f"Failed to create collection {name}: {e}")
                
    async def index_expert(self, expert: Expert) -> bool:
        """Index an expert in vector database."""
        try:
            expert_id = expert.id
            
            # Index description
            self.collections["expert-descriptions"].upsert(
                ids=[expert_id],
                documents=[expert.description],
                metadatas=[{
                    "expert_name": expert.name,
                    "version": expert.version,
                    "domains": ",".join(expert.domains),
                    "updated_at": datetime.now().isoformat()
                }]
            )
            
            # Index patterns
            if expert.patterns:
                pattern_text = "\n".join(expert.patterns)
                self.collections["expert-patterns"].upsert(
                    ids=[f"{expert_id}_patterns"],
                    documents=[pattern_text],
                    metadatas=[{"expert_id": expert_id}]
                )
                
            # Index constraints
            if expert.constraints:
                constraint_text = "\n".join(expert.constraints)
                self.collections["expert-constraints"].upsert(
                    ids=[f"{expert_id}_constraints"],
                    documents=[constraint_text],
                    metadatas=[{"expert_id": expert_id}]
                )
                
            # Index technologies
            tech_descriptions = []
            for spec in expert.specializations:
                tech_desc = f"{spec.technology}: {', '.join(spec.frameworks)} ({spec.expertise_level})"
                tech_descriptions.append(tech_desc)
                
            if tech_descriptions:
                self.collections["expert-technologies"].upsert(
                    ids=[f"{expert_id}_tech"],
                    documents=["\n".join(tech_descriptions)],
                    metadatas=[{
                        "expert_id": expert_id,
                        "technologies": ",".join([s.technology for s in expert.specializations])
                    }]
                )
                
            # Clear cache for this expert
            cache_keys_to_remove = [k for k in self.embedding_cache.keys() if expert_id in str(k)]
            for key in cache_keys_to_remove:
                del self.embedding_cache[key]
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to index expert {expert.id}: {e}")
            return False
            
    async def search_experts(
        self,
        query: str,
        search_mode: str = "hybrid",
        limit: int = 5
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search for experts using semantic similarity.
        
        Returns list of (expert_id, score, metadata) tuples.
        """
        cache_key = f"search:{query}:{search_mode}:{limit}"
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]
            
        results = []
        
        if search_mode in ["description", "hybrid"]:
            desc_results = self.collections["expert-descriptions"].query(
                query_texts=[query],
                n_results=limit * 2 if search_mode == "hybrid" else limit
            )
            for i, expert_id in enumerate(desc_results['ids'][0]):
                score = 1.0 - desc_results['distances'][0][i]  # Convert distance to similarity
                metadata = desc_results['metadatas'][0][i]
                results.append((expert_id, score * 0.4, metadata))
                
        if search_mode in ["patterns", "hybrid"]:
            pattern_results = self.collections["expert-patterns"].query(
                query_texts=[query],
                n_results=limit
            )
            for i, doc_id in enumerate(pattern_results['ids'][0]):
                expert_id = pattern_results['metadatas'][0][i]['expert_id']
                score = 1.0 - pattern_results['distances'][0][i]
                results.append((expert_id, score * 0.3, {}))
                
        if search_mode in ["constraints", "hybrid"]:
            constraint_results = self.collections["expert-constraints"].query(
                query_texts=[query],
                n_results=limit
            )
            for i, doc_id in enumerate(constraint_results['ids'][0]):
                expert_id = constraint_results['metadatas'][0][i]['expert_id']
                score = 1.0 - constraint_results['distances'][0][i]
                results.append((expert_id, score * 0.3, {}))
                
        # Combine scores for same expert
        expert_scores = {}
        expert_metadata = {}
        
        for expert_id, score, metadata in results:
            if expert_id not in expert_scores:
                expert_scores[expert_id] = 0
                expert_metadata[expert_id] = metadata
            expert_scores[expert_id] += score
            
        # Sort by combined score
        sorted_results = [
            (expert_id, score, expert_metadata.get(expert_id, {}))
            for expert_id, score in sorted(
                expert_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )
        ][:limit]
        
        self.embedding_cache[cache_key] = sorted_results
        return sorted_results
        
    async def find_similar_experts(
        self,
        expert_id: str,
        similarity_type: str = "overall",
        limit: int = 3
    ) -> List[Tuple[str, float]]:
        """Find experts similar to a given expert.
        
        Returns list of (expert_id, similarity_score) tuples.
        """
        cache_key = f"similar:{expert_id}:{similarity_type}:{limit}"
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]
            
        collection_map = {
            "overall": "expert-descriptions",
            "patterns": "expert-patterns",
            "technology": "expert-technologies"
        }
        
        collection_name = collection_map.get(similarity_type, "expert-descriptions")
        collection = self.collections[collection_name]
        
        # Get the embedding for the source expert
        doc_id = expert_id
        if similarity_type != "overall":
            doc_id = f"{expert_id}_{similarity_type}"
            
        try:
            # For "overall" similarity, query using document text instead of embeddings
            if similarity_type == "overall":
                # Get the source expert's description text for query
                source_doc = collection.get(ids=[expert_id], include=['documents'])
                if not source_doc['documents'] or not source_doc['documents'][0]:
                    logger.warning(f"No document found for expert {expert_id}")
                    return []
                
                source_text = source_doc['documents'][0]
                # Query using text similarity
                results = collection.query(
                    query_texts=[source_text],
                    n_results=limit + 1,  # Get extra to exclude self
                )
            else:
                # Get the embedding for the source expert
                source_embedding = self._get_expert_embedding(collection, doc_id)
                if source_embedding is None:
                    logger.warning(f"No embedding found for expert {expert_id}")
                    return []
                    
                # Query for similar items, excluding the source
                results = collection.query(
                    query_embeddings=[source_embedding],
                    n_results=limit + 1,  # Get extra to exclude self
                    where={"expert_id": {"$ne": expert_id}}
                )
            
            similar_experts = []
            for i, result_id in enumerate(results['ids'][0]):
                if result_id != expert_id:  # Exclude self
                    similarity = 1.0 - results['distances'][0][i]
                    actual_expert_id = result_id
                    
                    # Extract expert ID from compound IDs
                    if "_" in result_id and similarity_type != "overall":
                        actual_expert_id = results['metadatas'][0][i].get('expert_id', result_id)
                        
                    similar_experts.append((actual_expert_id, similarity))
                    
                if len(similar_experts) >= limit:
                    break
                    
            self.embedding_cache[cache_key] = similar_experts
            return similar_experts
            
        except Exception as e:
            logger.error(f"Failed to find similar experts: {e}")
            return []
            
    def _get_expert_embedding(self, collection: Any, doc_id: str) -> Optional[List[float]]:
        """Get embedding for a document from collection."""
        try:
            result = collection.get(ids=[doc_id], include=['embeddings'])
            # Check if we have embeddings in the result
            embeddings = result.get('embeddings', [])
            if isinstance(embeddings, list) and len(embeddings) > 0 and embeddings[0] is not None:
                embedding = embeddings[0]
                # Convert numpy array to list if needed
                if hasattr(embedding, 'tolist'):
                    return embedding.tolist()
                return embedding
        except Exception as e:
            logger.error(f"Error getting embedding for {doc_id}: {e}")
        return None
        
    async def add_task_history(
        self,
        task_id: str,
        task_description: str,
        selected_expert_id: str,
        success: bool,
        metadata: Optional[Dict] = None
    ):
        """Add task to history for collaborative filtering."""
        self.collections["task-history"].upsert(
            ids=[task_id],
            documents=[task_description],
            metadatas=[{
                "selected_expert": selected_expert_id,
                "success": str(success),
                "timestamp": datetime.now().isoformat(),
                **(metadata or {})
            }]
        )
        
    async def get_expert_embeddings(self, expert_id: str) -> Optional[ExpertEmbedding]:
        """Get all embeddings for an expert."""
        embeddings = {}
        
        # Get description embedding
        desc_result = self.collections["expert-descriptions"].get(
            ids=[expert_id],
            include=['embeddings']
        )
        if desc_result['embeddings']:
            embeddings['description'] = desc_result['embeddings'][0]
            
        # Get pattern embedding
        pattern_result = self.collections["expert-patterns"].get(
            ids=[f"{expert_id}_patterns"],
            include=['embeddings']
        )
        if pattern_result['embeddings']:
            embeddings['patterns'] = pattern_result['embeddings'][0]
            
        # Get constraint embedding
        constraint_result = self.collections["expert-constraints"].get(
            ids=[f"{expert_id}_constraints"],
            include=['embeddings']
        )
        if constraint_result['embeddings']:
            embeddings['constraints'] = constraint_result['embeddings'][0]
            
        # Get technology embedding
        tech_result = self.collections["expert-technologies"].get(
            ids=[f"{expert_id}_tech"],
            include=['embeddings']
        )
        if tech_result['embeddings']:
            embeddings['technologies'] = tech_result['embeddings'][0]
            
        if not embeddings:
            return None
            
        # Fill missing embeddings with zeros
        embedding_dim = len(next(iter(embeddings.values())))
        default_embedding = [0.0] * embedding_dim
        
        return ExpertEmbedding(
            expert_id=expert_id,
            embeddings={
                'description': embeddings.get('description', default_embedding),
                'domains': embeddings.get('description', default_embedding),  # Reuse description
                'technologies': embeddings.get('technologies', default_embedding),
                'patterns': embeddings.get('patterns', default_embedding),
                'constraints': embeddings.get('constraints', default_embedding)
            },
            metadata={
                'model': 'all-MiniLM-L6-v2',
                'timestamp': datetime.now(),
                'version': '1.0.0'
            }
        )
        
    async def reset_database(self):
        """Reset all collections (useful for testing)."""
        try:
            self.client.reset()
            self._init_collections()
            self.embedding_cache.clear()
            logger.info("Vector database reset successfully")
        except Exception as e:
            logger.error(f"Failed to reset vector database: {e}")
            
    async def get_collection_stats(self) -> Dict[str, int]:
        """Get statistics about collections."""
        stats = {}
        for name, collection in self.collections.items():
            try:
                count = collection.count()
                stats[name] = count
            except Exception as e:
                logger.error(f"Failed to get stats for {name}: {e}")
                stats[name] = -1
        return stats