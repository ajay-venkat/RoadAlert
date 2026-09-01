"""
RoadWatch AI — FastAPI Application
Main API server for pothole detection, storage, and retrieval.
"""

import os
import uuid
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import io

from config import settings
from models.detection import (
    DetectionResponse,
    DetectionListResponse,
    Severity,
    DetectionStatus,
    StatsResponse,
    StatusUpdate,
)
from services.db_service import db_service
from services.yolo_service import yolo_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("roadwatch")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle management."""
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await db_service.connect()
    logger.info("🚦 RoadWatch AI Backend — Ready")
    yield
    # Shutdown
    await db_service.disconnect()
    logger.info("🛑 RoadWatch AI Backend — Shutdown")


app = FastAPI(
    title="RoadWatch AI",
    description="AI-powered pothole detection and civic reporting API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve detection images as static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── Health Check ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RoadWatch AI",
        "device": yolo_service.device,
        "model_loaded": yolo_service.model is not None,
    }


# ─── Detection Endpoint ────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectionResponse)
async def detect_potholes(
    file: UploadFile = File(..., description="Image file to analyze"),
    lat: Optional[float] = Form(None, description="Latitude"),
    lon: Optional[float] = Form(None, description="Longitude"),
    timestamp: Optional[str] = Form(None, description="ISO timestamp"),
    source: Optional[str] = Form("upload", description="Source: upload, mobile, cctv"),
):
    """
    Upload an image for pothole detection.
    Returns bounding boxes, severity classification, and saves to database.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (JPEG, PNG, etc.)")

    # Read and open image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Failed to process image: {str(e)}")

    # Run YOLO inference
    detections, max_confidence = yolo_service.run_inference(image)
    overall_severity = yolo_service.get_overall_severity(detections)

    # Generate unique ID
    detection_id = str(uuid.uuid4())[:12]

    # Save original image
    image_filename = f"{detection_id}.jpg"
    image_path = os.path.join(settings.UPLOAD_DIR, image_filename)
    image.save(image_path, "JPEG", quality=85)

    # Save annotated image
    annotated_filename = f"{detection_id}_annotated.jpg"
    annotated_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)
    annotated_image = yolo_service.annotate_image(image, detections)
    annotated_image.save(annotated_path, "JPEG", quality=85)

    # Parse timestamp
    ts = datetime.utcnow()
    if timestamp:
        try:
            ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            ts = datetime.utcnow()

    # Build detection record
    record = {
        "id": detection_id,
        "lat": lat,
        "lon": lon,
        "timestamp": ts,
        "detections": [d.model_dump() for d in detections],
        "overall_severity": overall_severity.value,
        "max_confidence": max_confidence,
        "image_url": f"/static/detections/{image_filename}",
        "annotated_image_url": f"/static/detections/{annotated_filename}",
        "status": DetectionStatus.REPORTED.value,
        "source": source or "upload",
        "detection_count": len(detections),
    }

    # Store in MongoDB
    await db_service.insert_detection(record)

    return DetectionResponse(
        id=detection_id,
        detections=detections,
        overall_severity=overall_severity,
        max_confidence=max_confidence,
        lat=lat,
        lon=lon,
        timestamp=ts,
        image_url=record["image_url"],
        annotated_image_url=record["annotated_image_url"],
        status=DetectionStatus.REPORTED,
        detection_count=len(detections),
    )


# ─── List Detections ───────────────────────────────────────────────────────

@app.get("/detections", response_model=DetectionListResponse)
async def list_detections(
    severity: Optional[str] = Query(None, description="Filter: minor, moderate, severe"),
    status: Optional[str] = Query(None, description="Filter: reported, in_progress, fixed"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List all detections with optional filters and pagination."""
    sd = None
    ed = None
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(400, "Invalid start_date format")
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(400, "Invalid end_date format")

    result = await db_service.list_detections(
        severity=severity, status=status,
        start_date=sd, end_date=ed,
        skip=skip, limit=limit,
    )
    return result


# ─── Get Single Detection ──────────────────────────────────────────────────

@app.get("/detections/{detection_id}")
async def get_detection(detection_id: str):
    """Get a single detection by ID."""
    detection = await db_service.get_detection(detection_id)
    if not detection:
        raise HTTPException(404, f"Detection {detection_id} not found")
    return detection


# ─── Update Detection Status ───────────────────────────────────────────────

@app.patch("/detections/{detection_id}")
async def update_status(detection_id: str, body: StatusUpdate):
    """Update the status of a detection (reported → in_progress → fixed)."""
    updated = await db_service.update_detection_status(detection_id, body.status.value)
    if not updated:
        raise HTTPException(404, f"Detection {detection_id} not found")
    return updated


# ─── Stats ──────────────────────────────────────────────────────────────────

@app.get("/detections/stats/summary", response_model=StatsResponse)
async def get_stats():
    """Get aggregated detection statistics."""
    return await db_service.get_stats()


# ─── Nearby (Geospatial) ───────────────────────────────────────────────────

@app.get("/detections/nearby/search")
async def find_nearby(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: float = Query(500, description="Search radius in meters"),
    limit: int = Query(50, ge=1, le=200),
):
    """Find detections within a radius of a given GPS coordinate."""
    results = await db_service.find_nearby(lat, lon, radius, limit)
    return {"count": len(results), "detections": results}


# ─── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
