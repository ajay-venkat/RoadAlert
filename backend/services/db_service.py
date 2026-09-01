"""
RoadWatch AI — Database Service
Async MongoDB operations for detection records with geospatial indexing.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, GEOSPHERE

from config import settings

logger = logging.getLogger("roadwatch.db")


class DatabaseService:
    """Manages async MongoDB connections and CRUD operations."""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self):
        """Establish MongoDB connection and create indexes."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.DB_NAME]

            # Verify connection
            await self.client.admin.command("ping")
            logger.info(f"✅ Connected to MongoDB: {settings.DB_NAME}")

            # Create indexes
            collection = self.db.detections
            await collection.create_index([("location", GEOSPHERE)])
            await collection.create_index([("timestamp", DESCENDING)])
            await collection.create_index([("overall_severity", ASCENDING)])
            await collection.create_index([("status", ASCENDING)])
            logger.info("✅ Database indexes created")

        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise

    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("🔌 MongoDB connection closed")

    async def insert_detection(self, detection: dict) -> str:
        """Insert a new detection record. Returns the record ID."""
        # Add GeoJSON location field for geospatial queries
        if detection.get("lat") is not None and detection.get("lon") is not None:
            detection["location"] = {
                "type": "Point",
                "coordinates": [detection["lon"], detection["lat"]],
            }

        result = await self.db.detections.insert_one(detection)
        logger.info(f"📝 Detection inserted: {detection.get('id', result.inserted_id)}")
        return str(result.inserted_id)

    async def get_detection(self, detection_id: str) -> Optional[dict]:
        """Get a single detection by its ID."""
        doc = await self.db.detections.find_one({"id": detection_id})
        if doc:
            doc.pop("_id", None)
        return doc

    async def list_detections(
        self,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Dict:
        """List detections with optional filters and pagination."""
        query = {}

        if severity:
            query["overall_severity"] = severity
        if status:
            query["status"] = status
        if start_date or end_date:
            ts_query = {}
            if start_date:
                ts_query["$gte"] = start_date
            if end_date:
                ts_query["$lte"] = end_date
            query["timestamp"] = ts_query

        total = await self.db.detections.count_documents(query)

        cursor = (
            self.db.detections.find(query, {"_id": 0})
            .sort("timestamp", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        detections = await cursor.to_list(length=limit)

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "detections": detections,
        }

    async def update_detection_status(
        self, detection_id: str, status: str
    ) -> Optional[dict]:
        """Update the status of a detection."""
        result = await self.db.detections.find_one_and_update(
            {"id": detection_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
            return_document=True,
        )
        if result:
            result.pop("_id", None)
        return result

    async def find_nearby(
        self, lat: float, lon: float, radius_meters: float = 500, limit: int = 50
    ) -> List[dict]:
        """Find detections within a given radius of a point."""
        cursor = self.db.detections.find(
            {
                "location": {
                    "$nearSphere": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat],
                        },
                        "$maxDistance": radius_meters,
                    }
                }
            },
            {"_id": 0},
        ).limit(limit)

        return await cursor.to_list(length=limit)

    async def get_stats(self) -> dict:
        """Get aggregated statistics across all detections."""
        collection = self.db.detections

        total = await collection.count_documents({})

        # Count by severity
        severity_pipeline = [
            {"$group": {"_id": "$overall_severity", "count": {"$sum": 1}}}
        ]
        severity_cursor = collection.aggregate(severity_pipeline)
        by_severity = {}
        async for doc in severity_cursor:
            by_severity[doc["_id"]] = doc["count"]

        # Count by status
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_cursor = collection.aggregate(status_pipeline)
        by_status = {}
        async for doc in status_cursor:
            by_status[doc["_id"]] = doc["count"]

        # Daily trend (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        trend_pipeline = [
            {"$match": {"timestamp": {"$gte": thirty_days_ago}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        trend_cursor = collection.aggregate(trend_pipeline)
        daily_trend = []
        async for doc in trend_cursor:
            daily_trend.append({"date": doc["_id"], "count": doc["count"]})

        # Average confidence
        avg_pipeline = [
            {"$group": {"_id": None, "avg_conf": {"$avg": "$max_confidence"}}}
        ]
        avg_cursor = collection.aggregate(avg_pipeline)
        avg_confidence = 0.0
        async for doc in avg_cursor:
            avg_confidence = round(doc.get("avg_conf", 0.0), 4)

        return {
            "total_detections": total,
            "by_severity": by_severity,
            "by_status": by_status,
            "daily_trend": daily_trend,
            "avg_confidence": avg_confidence,
        }


# Singleton instance
db_service = DatabaseService()
