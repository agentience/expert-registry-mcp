"""Registry management with file watching and caching."""

import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import aiofiles
from cachetools import TTLCache

from .models import Expert, ExpertRegistry


class RegistryFileHandler(FileSystemEventHandler):
    """Handle file system events for registry updates."""
    
    def __init__(self, registry_manager: 'RegistryManager'):
        self.registry_manager = registry_manager
        
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('expert-registry.json'):
            # Schedule reload in the event loop
            asyncio.create_task(self.registry_manager.reload_registry())


class RegistryManager:
    """Manage expert registry with hot reload and caching."""
    
    def __init__(self, registry_path: Path, cache_ttl: int = 86400):
        self.registry_path = registry_path
        self.registry: Optional[ExpertRegistry] = None
        self.cache = TTLCache(maxsize=1000, ttl=cache_ttl)
        self.observer: Optional[Observer] = None
        self._reload_callbacks = []
        
    async def initialize(self):
        """Initialize registry and start file watching."""
        await self.load_registry()
        self.start_file_watcher()
        
    async def load_registry(self):
        """Load registry from JSON file."""
        try:
            async with aiofiles.open(self.registry_path, 'r') as f:
                content = await f.read()
                data = json.loads(content)
                self.registry = ExpertRegistry(**data)
                self.cache.clear()  # Clear cache on reload
                await self._notify_reload()
        except Exception as e:
            raise RuntimeError(f"Failed to load registry: {e}")
            
    async def reload_registry(self):
        """Reload registry (called by file watcher)."""
        print(f"Registry file changed, reloading...")
        await self.load_registry()
        
    def start_file_watcher(self):
        """Start watching registry file for changes."""
        self.observer = Observer()
        handler = RegistryFileHandler(self)
        self.observer.schedule(
            handler, 
            str(self.registry_path.parent), 
            recursive=False
        )
        self.observer.start()
        
    def stop_file_watcher(self):
        """Stop file watcher."""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            
    async def list_experts(
        self, 
        domain: Optional[str] = None,
        technology: Optional[str] = None,
        include_metrics: bool = False
    ) -> List[Expert]:
        """List experts with optional filtering."""
        if not self.registry:
            await self.load_registry()
            
        cache_key = f"list:{domain}:{technology}:{include_metrics}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        experts = self.registry.experts
        
        # Filter by domain
        if domain:
            experts = [
                e for e in experts 
                if any(domain.lower() in d.lower() for d in e.domains)
            ]
            
        # Filter by technology
        if technology:
            experts = [
                e for e in experts
                if any(
                    technology.lower() in s.technology.lower() or
                    any(technology.lower() in f.lower() for f in s.frameworks)
                    for s in e.specializations
                )
            ]
            
        # Optionally exclude metrics
        if not include_metrics:
            experts = [
                e.model_copy(update={"performance_metrics": None})
                for e in experts
            ]
            
        self.cache[cache_key] = experts
        return experts
        
    async def get_expert(self, expert_id: str) -> Optional[Expert]:
        """Get specific expert by ID."""
        if not self.registry:
            await self.load_registry()
            
        cache_key = f"expert:{expert_id}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        expert = next(
            (e for e in self.registry.experts if e.id == expert_id),
            None
        )
        
        if expert:
            self.cache[cache_key] = expert
            
        return expert
        
    async def search_experts(
        self,
        query: str,
        search_fields: Optional[List[str]] = None
    ) -> List[Expert]:
        """Search experts by query string."""
        if not self.registry:
            await self.load_registry()
            
        if not search_fields:
            search_fields = ["name", "description", "domains", "technologies"]
            
        query_lower = query.lower()
        results = []
        
        for expert in self.registry.experts:
            match = False
            
            # Search in basic fields
            if "name" in search_fields and query_lower in expert.name.lower():
                match = True
            elif "description" in search_fields and query_lower in expert.description.lower():
                match = True
            elif "domains" in search_fields:
                if any(query_lower in d.lower() for d in expert.domains):
                    match = True
            elif "technologies" in search_fields:
                if any(
                    query_lower in s.technology.lower()
                    for s in expert.specializations
                ):
                    match = True
                    
            if match:
                results.append(expert)
                
        return results
        
    async def update_expert_metrics(
        self,
        expert_id: str,
        metrics_update: Dict
    ) -> bool:
        """Update expert performance metrics."""
        expert = await self.get_expert(expert_id)
        if not expert:
            return False
            
        # Update metrics
        if not expert.performance_metrics:
            from .models import PerformanceMetrics
            expert.performance_metrics = PerformanceMetrics(
                average_adherence_score=0.0,
                successful_applications=0,
                total_applications=0
            )
            
        for key, value in metrics_update.items():
            if hasattr(expert.performance_metrics, key):
                setattr(expert.performance_metrics, key, value)
                
        expert.performance_metrics.last_used = datetime.now()
        
        # Clear cache for this expert
        cache_key = f"expert:{expert_id}"
        if cache_key in self.cache:
            del self.cache[cache_key]
            
        # Note: In production, you'd persist this to the JSON file
        return True
        
    def add_reload_callback(self, callback):
        """Add callback for registry reload events."""
        self._reload_callbacks.append(callback)
        
    async def _notify_reload(self):
        """Notify all reload callbacks."""
        for callback in self._reload_callbacks:
            if asyncio.iscoroutinefunction(callback):
                await callback()
            else:
                callback()
                
    async def cleanup(self):
        """Clean up resources."""
        self.stop_file_watcher()
        self.cache.clear()