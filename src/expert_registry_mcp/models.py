"""Data models for Expert Registry MCP Server."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class TaskType(str, Enum):
    """Supported task types for expert selection."""
    BUG_FIX = "bug-fix"
    INVESTIGATION = "investigation"
    REFACTORING = "refactoring"
    FEATURE = "feature"
    ARTICLE = "article"
    GENERAL = "general"


class ExpertSpecialization(BaseModel):
    """Specialization details for an expert."""
    technology: str
    frameworks: List[str] = Field(default_factory=list)
    expertise_level: str = "expert"


class PerformanceMetrics(BaseModel):
    """Performance tracking for an expert."""
    average_adherence_score: float = Field(ge=0.0, le=10.0)
    successful_applications: int = Field(ge=0)
    total_applications: int = Field(ge=0)
    last_used: Optional[datetime] = None


class Expert(BaseModel):
    """Complete expert definition."""
    id: str
    name: str
    version: str
    description: str
    domains: List[str]
    specializations: List[ExpertSpecialization]
    workflow_compatibility: Dict[str, float] = Field(default_factory=dict)
    performance_metrics: Optional[PerformanceMetrics] = None
    constraints: List[str] = Field(default_factory=list)
    patterns: List[str] = Field(default_factory=list)
    quality_standards: List[str] = Field(default_factory=list)
    tools_required: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ExpertRegistry(BaseModel):
    """Central expert registry."""
    version: str
    last_updated: datetime
    experts: List[Expert]


class TechnologyDetectionResult(BaseModel):
    """Result of technology detection."""
    technologies: List[str]
    frameworks: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    detection_method: str = "auto"


class ExpertScore(BaseModel):
    """Scoring breakdown for expert selection."""
    expert_id: str
    total_score: float = Field(default=0.0, ge=0.0, le=1.0)
    technology_match: float = Field(default=0.0, ge=0.0, le=1.0)
    workflow_compatibility: float = Field(default=0.0, ge=0.0, le=1.0)
    performance_history: float = Field(default=0.0, ge=0.0, le=1.0)
    capability_assessment: float = Field(default=0.0, ge=0.0, le=1.0)
    semantic_similarity: Optional[float] = Field(None, ge=0.0, le=1.0)
    graph_connectivity: Optional[float] = Field(None, ge=0.0, le=1.0)


class ExpertSelectionResult(BaseModel):
    """Result of expert selection process."""
    expert: Expert
    score: ExpertScore
    reasoning: str
    alternatives: List[ExpertScore] = Field(default_factory=list)
    selection_strategy: str = "single"


class ExpertContext(BaseModel):
    """Loaded expert context."""
    expert_id: str
    content: str
    sections: Dict[str, str] = Field(default_factory=dict)
    loaded_at: datetime = Field(default_factory=datetime.now)


class CapabilityAssessment(BaseModel):
    """Expert capability assessment for a task."""
    expert_id: str
    task_description: str
    capability_score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    assessed_at: datetime = Field(default_factory=datetime.now)


class UsageTracking(BaseModel):
    """Track expert usage for analytics."""
    expert_id: str
    task_id: str
    task_type: TaskType
    started_at: datetime
    completed_at: Optional[datetime] = None
    success: bool = False
    adherence_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    error_message: Optional[str] = None


class ExpertTeam(BaseModel):
    """Team of complementary experts."""
    experts: List[Expert]
    coverage_score: float = Field(ge=0.0, le=1.0)
    synergy_score: float = Field(ge=0.0, le=1.0)
    reasoning: str


class ExpertEmbedding(BaseModel):
    """Vector embeddings for an expert."""
    expert_id: str
    embeddings: Dict[str, List[float]] = Field(
        description="Embeddings for different aspects (description, domains, technologies, patterns, constraints)"
    )
    metadata: Dict[str, Any] = Field(
        description="Metadata about embeddings (model, timestamp, version)"
    )