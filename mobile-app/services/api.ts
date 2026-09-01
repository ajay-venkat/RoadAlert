/**
 * RoadWatch AI — Mobile API Service
 * Handles communication with the backend inference server.
 */

import * as FileSystem from "expo-file-system";

// Default API URL — can be overridden from settings
let API_BASE = "http://192.168.1.100:8000"; // Update to your backend IP

export function setApiBase(url: string) {
  API_BASE = url.replace(/\/$/, "");
}

export function getApiBase(): string {
  return API_BASE;
}

export interface DetectionResult {
  id: string;
  detections: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
    class_name: string;
    severity: "minor" | "moderate" | "severe";
  }>;
  overall_severity: "minor" | "moderate" | "severe";
  max_confidence: number;
  lat: number | null;
  lon: number | null;
  timestamp: string;
  image_url: string;
  annotated_image_url: string;
  status: string;
  detection_count: number;
}

/**
 * Upload an image for pothole detection.
 */
export async function uploadForDetection(
  imageUri: string,
  lat?: number,
  lon?: number
): Promise<DetectionResult> {
  const formData = new FormData();

  // Append image file
  const filename = imageUri.split("/").pop() || "capture.jpg";
  formData.append("file", {
    uri: imageUri,
    name: filename,
    type: "image/jpeg",
  } as any);

  // Append GPS data
  if (lat !== undefined) formData.append("lat", String(lat));
  if (lon !== undefined) formData.append("lon", String(lon));
  formData.append("timestamp", new Date().toISOString());
  formData.append("source", "mobile");

  const response = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Detection API error (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Fetch recent detections from the backend.
 */
export async function fetchDetections(
  limit: number = 20
): Promise<{ total: number; detections: DetectionResult[] }> {
  const response = await fetch(
    `${API_BASE}/detections?limit=${limit}&skip=0`
  );
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

/**
 * Check if the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}
