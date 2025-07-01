"""Embedding generation pipeline for semantic search."""

import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import hashlib
import json

from sentence_transformers import SentenceTransformer
import numpy as np
from cachetools import LRUCache

from .models import Expert, ExpertEmbedding

logger = logging.getLogger(__name__)


class EmbeddingPipeline:
    """Generate and manage embeddings for experts and tasks."""
    
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        cache_size: int = 1000,
        device: Optional[str] = None
    ):
        """Initialize embedding pipeline.
        
        Args:
            model_name: Name of the sentence transformer model
            cache_size: Size of the embedding cache
            device: Device to run model on (cpu/cuda), auto-detected if None
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name, device=device)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # Cache for embeddings
        self.cache = LRUCache(maxsize=cache_size)
        
        logger.info(f"Initialized embedding pipeline with {model_name} (dim: {self.embedding_dim})")
        
    async def process_expert(self, expert: Expert) -> ExpertEmbedding:
        """Generate all embeddings for an expert."""
        # Generate description embedding
        description_emb = await self.embed(expert.description)
        
        # Generate domain embeddings and average them
        domain_texts = expert.domains
        domain_emb = await self.embed_array(domain_texts) if domain_texts else description_emb
        
        # Generate technology embeddings
        tech_texts = []
        for spec in expert.specializations:
            tech_desc = f"{spec.technology}: {', '.join(spec.frameworks)} ({spec.expertise_level})"
            tech_texts.append(tech_desc)
        tech_emb = await self.embed_array(tech_texts) if tech_texts else description_emb
        
        # Generate pattern embeddings
        pattern_emb = await self.embed_array(expert.patterns) if expert.patterns else description_emb
        
        # Generate constraint embeddings
        constraint_emb = await self.embed_array(expert.constraints) if expert.constraints else description_emb
        
        return ExpertEmbedding(
            expert_id=expert.id,
            embeddings={
                "description": description_emb,
                "domains": domain_emb,
                "technologies": tech_emb,
                "patterns": pattern_emb,
                "constraints": constraint_emb
            },
            metadata={
                "model": self.model_name,
                "timestamp": datetime.now(),
                "version": expert.version
            }
        )
        
    async def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        # Check cache
        cache_key = self._get_cache_key(text)
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True).tolist()
        
        # Cache result
        self.cache[cache_key] = embedding
        
        return embedding
        
    async def embed_array(self, texts: List[str]) -> List[float]:
        """Generate embeddings for multiple texts and return average."""
        if not texts:
            return [0.0] * self.embedding_dim
            
        embeddings = []
        for text in texts:
            emb = await self.embed(text)
            embeddings.append(emb)
            
        # Return average embedding
        return self.average_embeddings(embeddings)
        
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts in batch."""
        # Check cache for all texts
        uncached_texts = []
        cached_results = {}
        
        for text in texts:
            cache_key = self._get_cache_key(text)
            if cache_key in self.cache:
                cached_results[text] = self.cache[cache_key]
            else:
                uncached_texts.append(text)
                
        # Generate embeddings for uncached texts
        if uncached_texts:
            new_embeddings = self.model.encode(uncached_texts, convert_to_numpy=True)
            
            # Cache new embeddings
            for text, emb in zip(uncached_texts, new_embeddings):
                cache_key = self._get_cache_key(text)
                emb_list = emb.tolist()
                self.cache[cache_key] = emb_list
                cached_results[text] = emb_list
                
        # Return in original order
        return [cached_results[text] for text in texts]
        
    def average_embeddings(self, embeddings: List[List[float]]) -> List[float]:
        """Calculate average of multiple embeddings."""
        if not embeddings:
            return [0.0] * self.embedding_dim
            
        # Convert to numpy for efficient averaging
        emb_array = np.array(embeddings)
        avg = np.mean(emb_array, axis=0)
        
        # Normalize the averaged embedding
        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm
            
        return avg.tolist()
        
    def weighted_average_embeddings(
        self,
        embeddings: List[List[float]],
        weights: List[float]
    ) -> List[float]:
        """Calculate weighted average of embeddings."""
        if not embeddings:
            return [0.0] * self.embedding_dim
            
        # Ensure weights sum to 1
        weight_sum = sum(weights)
        if weight_sum > 0:
            weights = [w / weight_sum for w in weights]
        else:
            weights = [1.0 / len(weights)] * len(weights)
            
        # Weighted average
        emb_array = np.array(embeddings)
        weight_array = np.array(weights).reshape(-1, 1)
        weighted_avg = np.sum(emb_array * weight_array, axis=0)
        
        # Normalize
        norm = np.linalg.norm(weighted_avg)
        if norm > 0:
            weighted_avg = weighted_avg / norm
            
        return weighted_avg.tolist()
        
    async def compute_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """Compute cosine similarity between two embeddings."""
        # Convert to numpy arrays
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        # Compute cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 > 0 and norm2 > 0:
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        else:
            return 0.0
            
    async def find_similar_texts(
        self,
        query_embedding: List[float],
        candidate_embeddings: List[List[float]],
        candidate_texts: List[str],
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """Find most similar texts based on embeddings."""
        similarities = []
        
        for i, candidate_emb in enumerate(candidate_embeddings):
            sim = await self.compute_similarity(query_embedding, candidate_emb)
            similarities.append((candidate_texts[i], sim))
            
        # Sort by similarity descending
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
        
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        # Use hash for consistent key length
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return f"{self.model_name}:{text_hash}"
        
    async def enhance_task_embedding(
        self,
        task_description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[float]:
        """Generate enhanced embedding for a task with context."""
        # Base task embedding
        task_emb = await self.embed(task_description)
        
        if not context:
            return task_emb
            
        # Generate embeddings for context elements
        context_embeddings = []
        weights = []
        
        # Technologies context
        if "technologies" in context and context["technologies"]:
            tech_text = "Technologies: " + ", ".join(context["technologies"])
            tech_emb = await self.embed(tech_text)
            context_embeddings.append(tech_emb)
            weights.append(0.3)
            
        # Constraints context
        if "constraints" in context and context["constraints"]:
            constraint_text = "Constraints: " + ". ".join(context["constraints"])
            constraint_emb = await self.embed(constraint_text)
            context_embeddings.append(constraint_emb)
            weights.append(0.2)
            
        # Requirements context
        if "requirements" in context and context["requirements"]:
            req_text = "Requirements: " + ". ".join(context["requirements"])
            req_emb = await self.embed(req_text)
            context_embeddings.append(req_emb)
            weights.append(0.2)
            
        # Combine with task embedding
        if context_embeddings:
            # Add task embedding with remaining weight
            context_embeddings.insert(0, task_emb)
            weights.insert(0, 1.0 - sum(weights))
            
            return self.weighted_average_embeddings(context_embeddings, weights)
        else:
            return task_emb
            
    def clear_cache(self):
        """Clear the embedding cache."""
        self.cache.clear()
        logger.info("Embedding cache cleared")
        
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "cache_size": len(self.cache),
            "max_size": self.cache.maxsize,
            "hit_rate": getattr(self.cache, "hit_rate", None),
            "model": self.model_name,
            "embedding_dim": self.embedding_dim
        }