"""
RoadWatch AI — Detection Models
Pydantic models for API request/response schemas.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Severity(str, Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"


class DetectionStatus(str, Enum):
    REPORTED = "reported"
    IN_PROGRESS = "in_progress"
    FIXED = "fixed"


class BoundingBox(BaseModel):
    """A single detected object bounding box."""
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    class_name: str
    severity: Severity


class DetectionRecord(BaseModel):
    """A full detection event stored in the database."""
    id: str = Field(..., description="Unique detection ID")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    detections: List[BoundingBox] = Field(default_factory=list)
    overall_severity: Severity = Severity.MINOR
    max_confidence: float = 0.0
    image_url: str = ""
    annotated_image_url: str = ""
    status: DetectionStatus = DetectionStatus.REPORTED
    source: str = Field("upload", description="Source: upload, mobile, cctv")
    detection_count: int = 0


class DetectionResponse(BaseModel):
    """API response for a detection request."""
    id: str
    detections: List[BoundingBox]
    overall_severity: Severity
    max_confidence: float
    lat: Optional[float]
    lon: Optional[float]
    timestamp: datetime
    image_url: str
    annotated_image_url: str
    status: DetectionStatus
    detection_count: int


class DetectionListResponse(BaseModel):
    """Paginated list of detections."""
    total: int
    skip: int
    limit: int
    detections: List[DetectionResponse]


class StatsResponse(BaseModel):
    """Aggregated statistics."""
    total_detections: int = 0
    by_severity: dict = Field(default_factory=dict)
    by_status: dict = Field(default_factory=dict)
    daily_trend: List[dict] = Field(default_factory=list)
    avg_confidence: float = 0.0


class StatusUpdate(BaseModel):
    """Request body to update detection status."""
    status: DetectionStatus
