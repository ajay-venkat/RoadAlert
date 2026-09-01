"use client";

import { Detection, getImageUrl } from "@/lib/api";

interface DetectionCardProps {
  detection: Detection;
  onClick?: (detection: Detection) => void;
  style?: React.CSSProperties;
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function formatCoords(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null) return "No location";
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
}

export default function DetectionCard({
  detection,
  onClick,
  style,
}: DetectionCardProps) {
  return (
    <div
      className="detection-card"
      onClick={() => onClick?.(detection)}
      style={style}
    >
      <div className="detection-card-header">
        <span className="detection-card-id">#{detection.id}</span>
        <span className={`severity-badge ${detection.overall_severity}`}>
          {detection.overall_severity}
        </span>
      </div>

      <div className="detection-card-body">
        <img
          src={getImageUrl(detection.annotated_image_url)}
          alt="Detection"
          className="detection-card-thumb"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="detection-card-info">
          <div className="detection-card-location">
            📍 {formatCoords(detection.lat, detection.lon)}
          </div>
          <div className="detection-card-time">
            🕐 {formatTimestamp(detection.timestamp)}
          </div>
          <div className="detection-card-confidence">
            🎯 {(detection.max_confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
      </div>

      <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
        <span className={`status-badge ${detection.status}`}>
          {detection.status.replace("_", " ")}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
          {detection.detection_count} detection{detection.detection_count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
