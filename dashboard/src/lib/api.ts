/**
 * RoadWatch AI — API Client Library
 * Fetch wrapper for backend API communication.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_id: number;
  class_name: string;
  severity: "minor" | "moderate" | "severe";
}

export interface Detection {
  id: string;
  lat: number | null;
  lon: number | null;
  timestamp: string;
  detections: BoundingBox[];
  overall_severity: "minor" | "moderate" | "severe";
  max_confidence: number;
  image_url: string;
  annotated_image_url: string;
  status: "reported" | "in_progress" | "fixed";
  detection_count: number;
  source?: string;
  zone?: string;
}

export interface DetectionListResponse {
  total: number;
  skip: number;
  limit: number;
  detections: Detection[];
}

export interface Stats {
  total_detections: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  daily_trend: Array<{ date: string; count: number }>;
  avg_confidence: number;
}

export interface DetectionFilters {
  severity?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

/**
 * Fetch all detections with optional filters.
 */
export async function getDetections(
  filters: DetectionFilters = {}
): Promise<DetectionListResponse> {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.status) params.set("status", filters.status);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.skip !== undefined) params.set("skip", String(filters.skip));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const url = `${API_BASE}/detections?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch aggregated statistics.
 */
export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/detections/stats/summary`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Find detections near a GPS coordinate.
 */
export async function getNearby(
  lat: number,
  lon: number,
  radius: number = 500
): Promise<{ count: number; detections: Detection[] }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radius),
  });
  const res = await fetch(`${API_BASE}/detections/nearby/search?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Update detection status.
 */
export async function updateDetectionStatus(
  id: string,
  status: "reported" | "in_progress" | "fixed"
): Promise<Detection> {
  const res = await fetch(`${API_BASE}/detections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Upload an image for detection.
 */
export async function uploadDetection(
  file: File,
  lat?: number,
  lon?: number
): Promise<Detection> {
  const formData = new FormData();
  formData.append("file", file);
  if (lat !== undefined) formData.append("lat", String(lat));
  if (lon !== undefined) formData.append("lon", String(lon));
  formData.append("timestamp", new Date().toISOString());
  formData.append("source", "dashboard");

  const res = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Get the full URL for a backend image path.
 */
export function getImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}
