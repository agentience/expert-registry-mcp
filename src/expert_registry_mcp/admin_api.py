"""Admin API endpoints for Expert Registry MCP."""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import asyncio
import json
import logging
from pathlib import Path

from .models import Expert, TaskType, ExpertScore
from .registry import RegistryManager
from .context import ContextManager
from .vector_db import VectorDatabaseManager
from .graph_db import GraphDatabaseManager
from .discovery import HybridDiscovery
from .selection import SelectionEngine
from .embeddings import EmbeddingPipeline

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize managers (these would be injected in production)
base_path = Path("./expert-system")
registry_manager = RegistryManager(base_path / "registry" / "expert-registry.json")
context_manager = ContextManager(base_path / "expert-contexts")
vector_db = VectorDatabaseManager(base_path / "vector-db")
selection_engine = SelectionEngine(registry_manager)

# Initialize embedding pipeline and graph database
embedding_pipeline = EmbeddingPipeline()
graph_db = GraphDatabaseManager()

# Initialize discovery engine with proper dependencies
discovery_engine = HybridDiscovery(registry_manager, vector_db, graph_db, embedding_pipeline)

# Initialize database connections asynchronously
async def initialize_databases():
    """Initialize database connections."""
    try:
        await graph_db.initialize()
        logger.info("Graph database initialized successfully")
    except Exception as e:
        logger.warning(f"Graph database initialization failed: {e}")

# Store initialization task for startup
_db_init_task = None

class ExpertCreate(BaseModel):
    id: str
    name: str
    version: str = "1.0.0"
    description: str
    domains: List[str]
    specializations: List[Dict[str, Any]]
    workflow_compatibility: Dict[str, float]
    constraints: List[str]
    patterns: List[str]
    quality_standards: List[str]

class ExpertUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    domains: Optional[List[str]] = None
    specializations: Optional[List[Dict[str, Any]]] = None
    workflow_compatibility: Optional[Dict[str, float]] = None
    constraints: Optional[List[str]] = None
    patterns: Optional[List[str]] = None
    quality_standards: Optional[List[str]] = None

@router.get("/experts")
async def list_experts(
    domain: Optional[str] = None,
    technology: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Expert]:
    """List all experts with optional filtering."""
    experts = await registry_manager.list_experts(
        domain=domain,
        technology=technology,
        include_metrics=True
    )
    
    # Apply pagination
    return experts[offset:offset + limit]

@router.get("/experts/{expert_id}")
async def get_expert(expert_id: str) -> Expert:
    """Get a specific expert by ID."""
    expert = await registry_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail=f"Expert not found: {expert_id}")
    return expert

@router.post("/experts")
async def create_expert(expert: ExpertCreate, background_tasks: BackgroundTasks) -> Expert:
    """Create a new expert."""
    # Check if expert already exists
    existing = await registry_manager.get_expert(expert.id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Expert already exists: {expert.id}")
    
    # Create expert object
    new_expert = Expert(
        id=expert.id,
        name=expert.name,
        version=expert.version,
        description=expert.description,
        domains=expert.domains,
        specializations=expert.specializations,
        workflow_compatibility=expert.workflow_compatibility,
        constraints=expert.constraints,
        patterns=expert.patterns,
        quality_standards=expert.quality_standards
    )
    
    # Add to registry
    await registry_manager.add_expert(new_expert)
    
    # Create default context file
    background_tasks.add_task(
        context_manager.create_default_context,
        expert.id,
        expert.name
    )
    
    return new_expert

@router.put("/experts/{expert_id}")
async def update_expert(expert_id: str, update: ExpertUpdate) -> Expert:
    """Update an existing expert."""
    expert = await registry_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail=f"Expert not found: {expert_id}")
    
    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expert, field, value)
    
    # Save to registry
    await registry_manager.update_expert(expert_id, expert)
    
    return expert

@router.delete("/experts/{expert_id}")
async def delete_expert(expert_id: str) -> Dict[str, str]:
    """Delete an expert."""
    expert = await registry_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail=f"Expert not found: {expert_id}")
    
    # Remove from registry
    await registry_manager.remove_expert(expert_id)
    
    # Remove context file
    try:
        await context_manager.delete_context(expert_id)
    except:
        pass  # Context file might not exist
    
    return {"status": "deleted", "expert_id": expert_id}

@router.get("/stats/overview")
async def get_overview_stats() -> Dict[str, Any]:
    """Get system-wide statistics."""
    experts = await registry_manager.list_experts(include_metrics=True)
    
    total_applications = sum(
        e.performance_metrics.total_applications 
        for e in experts 
        if e.performance_metrics
    )
    
    successful_applications = sum(
        e.performance_metrics.successful_applications 
        for e in experts 
        if e.performance_metrics
    )
    
    return {
        "total_experts": len(experts),
        "active_tasks": 5,  # This would come from task tracking
        "success_rate": round(
            (successful_applications / total_applications * 100) 
            if total_applications > 0 else 0, 
            1
        ),
        "avg_response_time": 124,  # This would come from performance tracking
        "total_requests_today": 1523,  # This would come from logs
        "total_requests_week": 8934,  # This would come from logs
    }

@router.get("/stats/experts/{expert_id}")
async def get_expert_stats(expert_id: str) -> Dict[str, Any]:
    """Get statistics for a specific expert."""
    expert = await registry_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail=f"Expert not found: {expert_id}")
    
    return {
        "expert_id": expert_id,
        "name": expert.name,
        "performance_metrics": expert.performance_metrics.model_dump() if expert.performance_metrics else None,
        "usage_trend": [
            {"date": "2025-06-25", "value": 45},
            {"date": "2025-06-26", "value": 52},
            {"date": "2025-06-27", "value": 48},
            {"date": "2025-06-28", "value": 61},
            {"date": "2025-06-29", "value": 58},
            {"date": "2025-06-30", "value": 72},
            {"date": "2025-07-01", "value": 65},
        ]
    }

@router.get("/stats/usage/timeline")
async def get_usage_timeline(
    range: str = "7d",
    expert_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get usage statistics over time."""
    # Generate sample data based on range
    data = []
    if range == "24h":
        for i in range(24):
            data.append({
                "date": f"{i}:00",
                "total": 50 + i * 2,
                "successful": 45 + i * 2,
                "failed": 5
            })
    elif range == "7d":
        dates = ["Jun 25", "Jun 26", "Jun 27", "Jun 28", "Jun 29", "Jun 30", "Jul 1"]
        for i, date in enumerate(dates):
            data.append({
                "date": date,
                "total": 100 + i * 20,
                "successful": 90 + i * 18,
                "failed": 10 + i * 2
            })
    else:
        # 30 days
        for i in range(30):
            data.append({
                "date": f"Day {i+1}",
                "total": 100 + i * 10,
                "successful": 85 + i * 9,
                "failed": 15 + i
            })
    
    return data

@router.get("/stats/performance")
async def get_performance_metrics(
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get performance metrics for experts."""
    experts = await registry_manager.list_experts(include_metrics=True)
    
    # Sort by success rate
    experts_with_metrics = [e for e in experts if e.performance_metrics]
    experts_with_metrics.sort(
        key=lambda e: e.performance_metrics.successful_applications / e.performance_metrics.total_applications
        if e.performance_metrics.total_applications > 0 else 0,
        reverse=True
    )
    
    return [
        {
            "id": e.id,
            "name": e.name,
            "successRate": round(
                e.performance_metrics.successful_applications / e.performance_metrics.total_applications * 100
                if e.performance_metrics.total_applications > 0 else 0,
                1
            ),
            "avgResponseTime": 100 + hash(e.id) % 200,  # Mock data
            "adherenceScore": e.performance_metrics.average_adherence_score,
            "totalUses": e.performance_metrics.total_applications,
            "trend": [20, 25, 22, 28, 30, 35, 32]  # Mock trend data
        }
        for e in experts_with_metrics[:limit]
    ]

@router.get("/expert-contexts/{expert_id}")
async def get_expert_context(expert_id: str) -> Dict[str, Any]:
    """Get the context file for an expert."""
    try:
        context = await context_manager.load_context(expert_id)
        return {
            "expert_id": expert_id,
            "content": context.content,
            "sections": context.sections,
            "loaded_at": context.loaded_at.isoformat()
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Context not found for expert: {expert_id}")

@router.post("/expert-contexts/{expert_id}")
async def update_expert_context(
    expert_id: str,
    body: Dict[str, str]
) -> Dict[str, str]:
    """Update the context file for an expert."""
    content = body.get("content", "")
    
    # Validate expert exists
    expert = await registry_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail=f"Expert not found: {expert_id}")
    
    # Save context
    await context_manager.save_context(expert_id, content)
    
    return {"status": "updated", "expert_id": expert_id}

# Server-Sent Events endpoint
async def event_generator():
    """Generate server-sent events for real-time updates."""
    while True:
        # Send heartbeat
        yield f"event: heartbeat\ndata: {json.dumps({'time': datetime.now().isoformat()})}\n\n"
        
        # Simulate occasional updates
        if hash(datetime.now().second) % 10 == 0:
            yield f"event: stats-update\ndata: {json.dumps({'type': 'overview'})}\n\n"
        
        await asyncio.sleep(5)

@router.get("/events")
async def events() -> StreamingResponse:
    """Server-sent events endpoint for real-time updates."""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# Expert Discovery Endpoints

class DiscoveryContext(BaseModel):
    description: str
    technologies: Optional[List[str]] = []
    constraints: Optional[List[str]] = []
    workflow_type: Optional[str] = "feature"
    include_inactive: Optional[bool] = False
    max_results: Optional[int] = 5
    confidence_threshold: Optional[float] = 0.0

class DiscoveryResult(BaseModel):
    experts: List[Expert]
    total_count: int
    search_time: float
    algorithm: str
    query: str

def enhance_expert_with_computed_fields(expert: Expert, score: float = None, score_details: ExpertScore = None) -> Expert:
    """Enhance expert with computed fields for UI display."""
    # Convert to dict to modify
    expert_dict = expert.model_dump()
    
    # Calculate confidence based on performance metrics and score
    if score is not None:
        confidence = score
    elif expert.performance_metrics:
        success_rate = (expert.performance_metrics.successful_applications / 
                       max(expert.performance_metrics.total_applications, 1))
        confidence = success_rate
    else:
        confidence = 0.8  # Default confidence
    
    # Determine active status based on last_used
    if expert.performance_metrics and expert.performance_metrics.last_used:
        from datetime import timedelta, timezone
        # Ensure we're comparing timezone-aware datetimes
        last_used = expert.performance_metrics.last_used
        if last_used.tzinfo is None:
            # If last_used is naive, assume UTC
            last_used = last_used.replace(tzinfo=timezone.utc)
        
        six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
        active = last_used > six_months_ago
    else:
        active = True  # Default to active
    
    # Compute experience level from specializations
    if expert.specializations:
        # Get the highest expertise level
        expertise_levels = [spec.expertise_level for spec in expert.specializations]
        if "expert" in expertise_levels:
            experience_level = "expert"
        elif "advanced" in expertise_levels:
            experience_level = "senior"
        elif "intermediate" in expertise_levels:
            experience_level = "mid"
        else:
            experience_level = "junior"
    else:
        experience_level = "mid"  # Default
    
    # Add computed fields
    expert_dict['confidence'] = float(confidence)  # Ensure it's a float
    expert_dict['active'] = bool(active)  # Ensure it's a bool
    expert_dict['experience_level'] = experience_level
    
    # Add score details if available
    if score_details:
        expert_dict['scores'] = {
            'total_score': score_details.total_score,
            'technology_match': score_details.technology_match,
            'workflow_compatibility': score_details.workflow_compatibility,
            'performance_history': score_details.performance_history,
            'capability_assessment': score_details.capability_assessment,
            'semantic_similarity': score_details.semantic_similarity if score_details.semantic_similarity is not None else 0.0,
            'graph_connectivity': score_details.graph_connectivity if score_details.graph_connectivity is not None else 0.0
        }
    
    # Ensure workflow_compatibility values are floats
    if 'workflow_compatibility' in expert_dict and expert_dict['workflow_compatibility']:
        expert_dict['workflow_compatibility'] = {
            k: float(v) for k, v in expert_dict['workflow_compatibility'].items()
        }
    
    # Create new Expert instance with computed fields
    return Expert(**expert_dict)

@router.post("/discovery/smart-discover")
async def smart_discover(context: DiscoveryContext) -> DiscoveryResult:
    """Smart discovery using hybrid AI engine."""
    try:
        # Ensure databases are initialized
        global _db_init_task
        if _db_init_task is None:
            _db_init_task = asyncio.create_task(initialize_databases())
        
        # Wait for initialization if still pending
        if not _db_init_task.done():
            await _db_init_task
        
        import time
        start_time = time.time()
        
        # Use the discovery engine to find experts
        result = await discovery_engine.discover(
            context=context.model_dump(),
            limit=context.max_results or 5
        )
        
        search_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Extract and enhance experts from the discovery result tuples
        experts = []
        filtered_count = 0
        
        for expert, score, metadata in result:
            # Handle different score formats
            score_value = None
            score_details = None
            
            if hasattr(score, 'total_score'):
                # It's an ExpertScore object
                score_value = score.total_score
                score_details = score
            elif isinstance(score, (int, float)):
                # It's just a numeric score
                score_value = float(score)
            else:
                # Default if score format is unexpected
                score_value = 0.8
            
            # Apply confidence threshold filtering
            if score_value < context.confidence_threshold:
                filtered_count += 1
                logger.info(f"Filtered out {expert.name}: score {score_value:.2f} < threshold {context.confidence_threshold:.2f}")
                continue
                
            enhanced_expert = enhance_expert_with_computed_fields(expert, score_value, score_details)
            logger.info(f"Including {expert.name}: score {score_value:.2f} >= threshold {context.confidence_threshold:.2f}")
            experts.append(enhanced_expert)
        
        # Log filtering results
        if filtered_count > 0:
            logger.info(f"Filtered out {filtered_count} experts below confidence threshold {context.confidence_threshold}")
        
        return DiscoveryResult(
            experts=experts,
            total_count=len(experts),
            search_time=search_time,
            algorithm="hybrid",
            query=context.description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")

class SemanticSearchRequest(BaseModel):
    query: str
    search_mode: str = "hybrid"
    limit: int = 5
    confidence_threshold: float = 0.0

@router.post("/discovery/semantic-search")
async def semantic_search(request: SemanticSearchRequest) -> DiscoveryResult:
    """Semantic search using natural language."""
    try:
        import time
        start_time = time.time()
        
        # Use vector database for semantic search
        results = await vector_db.search_experts(
            query=request.query,
            search_mode=request.search_mode,
            limit=request.limit
        )
        
        # Enhance experts with computed fields and apply confidence filtering
        enhanced_experts = []
        for expert in results:
            enhanced = enhance_expert_with_computed_fields(expert)
            if enhanced.confidence >= request.confidence_threshold:
                enhanced_experts.append(enhanced)
        
        search_time = (time.time() - start_time) * 1000
        
        return DiscoveryResult(
            experts=enhanced_experts,
            total_count=len(enhanced_experts),
            search_time=search_time,
            algorithm="vector",
            query=request.query
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

class BasicSearchRequest(BaseModel):
    query: str
    search_fields: Optional[List[str]] = None
    confidence_threshold: float = 0.0

@router.post("/discovery/search")
async def basic_search(request: BasicSearchRequest) -> DiscoveryResult:
    """Basic text search across expert fields."""
    try:
        import time
        start_time = time.time()
        
        # Use registry manager for basic search
        experts = await registry_manager.search_experts(
            query=request.query,
            search_fields=request.search_fields or ["name", "description", "domains", "specializations"]
        )
        
        # Enhance experts with computed fields and apply confidence filtering
        enhanced_experts = []
        for expert in experts:
            enhanced = enhance_expert_with_computed_fields(expert)
            if enhanced.confidence >= request.confidence_threshold:
                enhanced_experts.append(enhanced)
        
        search_time = (time.time() - start_time) * 1000
        
        return DiscoveryResult(
            experts=enhanced_experts,
            total_count=len(enhanced_experts),
            search_time=search_time,
            algorithm="keyword",
            query=request.query
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")