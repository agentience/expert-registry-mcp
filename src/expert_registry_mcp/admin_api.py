"""Admin API endpoints for Expert Registry MCP."""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import asyncio
import json
from pathlib import Path

from .models import Expert, TaskType
from .registry import RegistryManager
from .context import ContextManager
from .vector_db import VectorDatabaseManager
from .graph_db import GraphDatabaseManager

router = APIRouter()

# Initialize managers (these would be injected in production)
base_path = Path("./expert-system")
registry_manager = RegistryManager(base_path / "registry" / "expert-registry.json")
context_manager = ContextManager(base_path / "expert-contexts")

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