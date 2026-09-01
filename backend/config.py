"""
RoadWatch AI — Backend Configuration
Loads environment variables and provides centralized config.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "roadwatch")

    # YOLO Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/weights/best.pt")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "yolov8s.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
    IOU_THRESHOLD: float = float(os.getenv("IOU_THRESHOLD", "0.45"))

    # Severity thresholds (bounding box area as % of frame area)
    SEVERITY_MINOR_MAX: float = float(os.getenv("SEVERITY_MINOR_MAX", "0.02"))
    SEVERITY_MODERATE_MAX: float = float(os.getenv("SEVERITY_MODERATE_MAX", "0.05"))

    # Upload / static files
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "static/detections")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:8081,http://localhost:19006"
    ).split(",")

    # Road damage class mapping (RDD2022 standard)
    CLASS_NAMES: dict = {
        0: "D00",  # Longitudinal Crack
        1: "D10",  # Transverse Crack
        2: "D20",  # Alligator Crack
        3: "D40",  # Pothole
    }

    CLASS_DISPLAY_NAMES: dict = {
        "D00": "Longitudinal Crack",
        "D10": "Transverse Crack",
        "D20": "Alligator Crack",
        "D40": "Pothole",
    }


settings = Settings()
