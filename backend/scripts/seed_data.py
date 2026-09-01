"""
RoadWatch AI — Seed Data Script
Populates MongoDB with synthetic detection records for demo/development.

Generates ~80 detections across Goa (Panaji, Margao, Mapusa, Vasco, Ponda)
with realistic coordinates, timestamps, severity distribution, and placeholder images.

Usage:
    cd backend
    python scripts/seed_data.py
"""

import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.db_service import db_service
from config import settings


# ─── Goa Region Coordinates ────────────────────────────────────────────────

# Clusters of GPS coordinates around major Goa locations
GOA_LOCATIONS = {
    "Panaji": {
        "center": (15.4909, 73.8278),
        "spread": 0.015,
        "count": 20,
    },
    "Margao": {
        "center": (15.2832, 73.9862),
        "spread": 0.012,
        "count": 15,
    },
    "Mapusa": {
        "center": (15.5937, 73.8100),
        "spread": 0.010,
        "count": 12,
    },
    "Vasco da Gama": {
        "center": (15.3982, 73.8113),
        "spread": 0.012,
        "count": 12,
    },
    "Ponda": {
        "center": (15.4034, 74.0078),
        "spread": 0.008,
        "count": 10,
    },
    "Calangute": {
        "center": (15.5439, 73.7553),
        "spread": 0.008,
        "count": 8,
    },
}

SEVERITY_WEIGHTS = {
    "minor": 0.40,
    "moderate": 0.35,
    "severe": 0.25,
}

STATUS_WEIGHTS = {
    "reported": 0.55,
    "in_progress": 0.25,
    "fixed": 0.20,
}


def random_coord(center: tuple, spread: float) -> tuple:
    """Generate a random coordinate near a center point."""
    lat = center[0] + random.uniform(-spread, spread)
    lon = center[1] + random.uniform(-spread, spread)
    return round(lat, 6), round(lon, 6)


def random_timestamp(days_back: int = 30) -> datetime:
    """Generate a random timestamp within the last N days."""
    offset = random.randint(0, days_back * 24 * 3600)
    return datetime.utcnow() - timedelta(seconds=offset)


def weighted_choice(weights: dict) -> str:
    """Choose a key from a dict based on weights."""
    keys = list(weights.keys())
    vals = list(weights.values())
    return random.choices(keys, weights=vals, k=1)[0]


def generate_placeholder_image(
    detection_id: str, severity: str, width: int = 640, height: int = 480
) -> tuple:
    """Generate a placeholder detection image with a simulated bounding box."""
    # Road-like background color
    bg_colors = {
        "minor": (80, 80, 85),
        "moderate": (70, 65, 60),
        "severe": (60, 55, 50),
    }
    box_colors = {
        "minor": (0, 200, 0),
        "moderate": (255, 165, 0),
        "severe": (255, 0, 0),
    }

    img = Image.new("RGB", (width, height), bg_colors.get(severity, (80, 80, 80)))
    draw = ImageDraw.Draw(img)

    # Add some road texture (random lines)
    for _ in range(20):
        y = random.randint(0, height)
        gray = random.randint(60, 100)
        draw.line([(0, y), (width, y)], fill=(gray, gray, gray), width=1)

    # Draw a simulated pothole region
    box_w = random.randint(80, 250)
    box_h = random.randint(60, 180)
    x1 = random.randint(50, width - box_w - 50)
    y1 = random.randint(50, height - box_h - 50)
    x2 = x1 + box_w
    y2 = y1 + box_h

    # Dark pothole region
    for _ in range(200):
        px = random.randint(x1, x2)
        py = random.randint(y1, y2)
        gray = random.randint(20, 50)
        draw.point((px, py), fill=(gray, gray, gray))

    # Bounding box
    color = box_colors.get(severity, (255, 255, 255))
    draw.rectangle([x1, y1, x2, y2], outline=color, width=2)

    # Label
    confidence = round(random.uniform(0.55, 0.97), 2)
    label = f"D40 {confidence:.0%} [{severity}]"
    draw.rectangle([x1, y1 - 18, x1 + len(label) * 7, y1], fill=color)
    draw.text((x1 + 2, y1 - 16), label, fill=(255, 255, 255))

    bbox = {
        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
        "confidence": confidence,
        "class_id": 3,
        "class_name": "D40",
        "severity": severity,
    }

    return img, bbox


async def seed():
    """Generate and insert synthetic detection records."""
    print("=" * 60)
    print("🌱 RoadWatch AI — Seeding Database")
    print("=" * 60)

    await db_service.connect()

    # Clear existing data (optional — comment out to append)
    count = await db_service.db.detections.count_documents({})
    if count > 0:
        print(f"\n⚠️  Found {count} existing records. Clearing collection...")
        await db_service.db.detections.delete_many({})

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    total_inserted = 0

    for zone_name, zone_cfg in GOA_LOCATIONS.items():
        print(f"\n📍 {zone_name} — generating {zone_cfg['count']} detections...")

        for i in range(zone_cfg["count"]):
            detection_id = str(uuid.uuid4())[:12]
            lat, lon = random_coord(zone_cfg["center"], zone_cfg["spread"])
            severity = weighted_choice(SEVERITY_WEIGHTS)
            status = weighted_choice(STATUS_WEIGHTS)
            timestamp = random_timestamp(days_back=30)

            # Generate placeholder images
            img, bbox = generate_placeholder_image(detection_id, severity)

            # Save images
            img_filename = f"{detection_id}.jpg"
            annotated_filename = f"{detection_id}_annotated.jpg"
            img.save(upload_dir / img_filename, "JPEG", quality=80)
            img.save(upload_dir / annotated_filename, "JPEG", quality=80)

            # Build record
            record = {
                "id": detection_id,
                "lat": lat,
                "lon": lon,
                "timestamp": timestamp,
                "detections": [bbox],
                "overall_severity": severity,
                "max_confidence": bbox["confidence"],
                "image_url": f"/static/detections/{img_filename}",
                "annotated_image_url": f"/static/detections/{annotated_filename}",
                "status": status,
                "source": random.choice(["mobile", "upload", "cctv"]),
                "detection_count": 1,
                "zone": zone_name,
            }

            await db_service.insert_detection(record)
            total_inserted += 1

    print(f"\n✅ Seeded {total_inserted} detection records across {len(GOA_LOCATIONS)} zones")
    print(f"📁 Images saved to: {upload_dir.absolute()}")

    # Print summary
    stats = await db_service.get_stats()
    print(f"\n📊 Summary:")
    print(f"   Total:    {stats['total_detections']}")
    print(f"   Severity: {stats['by_severity']}")
    print(f"   Status:   {stats['by_status']}")

    await db_service.disconnect()


if __name__ == "__main__":
    asyncio.run(seed())
