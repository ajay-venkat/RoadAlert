# RoadWatch AI — API Documentation

## Base URL

```
http://localhost:8000
```

---

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "RoadWatch AI",
  "device": "cuda",
  "model_loaded": true
}
```

---

### Detect Potholes

```
POST /detect
Content-Type: multipart/form-data
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | Image file (JPEG, PNG) |
| `lat` | float | ❌ | Latitude |
| `lon` | float | ❌ | Longitude |
| `timestamp` | string | ❌ | ISO 8601 timestamp |
| `source` | string | ❌ | Source identifier: `upload`, `mobile`, `cctv` |

**Response:**
```json
{
  "id": "a1b2c3d4e5f6",
  "detections": [
    {
      "x1": 120.5,
      "y1": 200.3,
      "x2": 350.8,
      "y2": 380.1,
      "confidence": 0.87,
      "class_id": 3,
      "class_name": "D40",
      "severity": "moderate"
    }
  ],
  "overall_severity": "moderate",
  "max_confidence": 0.87,
  "lat": 15.4909,
  "lon": 73.8278,
  "timestamp": "2026-08-18T09:00:00Z",
  "image_url": "/static/detections/a1b2c3d4e5f6.jpg",
  "annotated_image_url": "/static/detections/a1b2c3d4e5f6_annotated.jpg",
  "status": "reported",
  "detection_count": 1
}
```

---

### List Detections

```
GET /detections
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `severity` | string | — | Filter: `minor`, `moderate`, `severe` |
| `status` | string | — | Filter: `reported`, `in_progress`, `fixed` |
| `start_date` | string | — | ISO date string |
| `end_date` | string | — | ISO date string |
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 50 | Max results (1–200) |

**Response:**
```json
{
  "total": 77,
  "skip": 0,
  "limit": 50,
  "detections": [ /* array of detection objects */ ]
}
```

---

### Get Single Detection

```
GET /detections/{detection_id}
```

---

### Update Detection Status

```
PATCH /detections/{detection_id}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "in_progress"
}
```

Valid statuses: `reported`, `in_progress`, `fixed`

---

### Get Statistics

```
GET /detections/stats/summary
```

**Response:**
```json
{
  "total_detections": 77,
  "by_severity": { "minor": 31, "moderate": 27, "severe": 19 },
  "by_status": { "reported": 42, "in_progress": 19, "fixed": 16 },
  "daily_trend": [
    { "date": "2026-08-01", "count": 5 },
    { "date": "2026-08-02", "count": 3 }
  ],
  "avg_confidence": 0.7825
}
```

---

### Find Nearby Detections

```
GET /detections/nearby/search
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `lat` | float | ✅ | Latitude |
| `lon` | float | ✅ | Longitude |
| `radius` | float | 500 | Search radius in meters |
| `limit` | int | 50 | Max results |

**Response:**
```json
{
  "count": 5,
  "detections": [ /* array of detection objects */ ]
}
```

---

## Severity Classification

Severity is determined by the bounding box area as a percentage of the total frame area:

| Severity | Box Area Ratio |
|----------|---------------|
| Minor | < 2% |
| Moderate | 2% – 5% |
| Severe | > 5% |

## RDD2022 Class Mapping

| Class ID | Code | Description |
|----------|------|-------------|
| 0 | D00 | Longitudinal Crack |
| 1 | D10 | Transverse Crack |
| 2 | D20 | Alligator Crack |
| 3 | D40 | Pothole |
