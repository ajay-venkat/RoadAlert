"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Detection, getImageUrl } from "@/lib/api";

// ─── Custom marker icon factory ───────────────────────────────
function createMarkerIcon(severity: string): L.DivIcon {
  const colors: Record<string, string> = {
    minor: "#22c55e",
    moderate: "#f59e0b",
    severe: "#ef4444",
  };
  const color = colors[severity] || "#6366f1";
  const size = severity === "severe" ? 16 : severity === "moderate" ? 14 : 12;

  return L.divIcon({
    className: `custom-marker ${severity}`,
    html: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// ─── Heatmap Layer Component ──────────────────────────────────
function HeatmapLayer({ detections }: { detections: Detection[] }) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamic import of leaflet.heat
    import("leaflet.heat").then(() => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      const points = detections
        .filter((d) => d.lat !== null && d.lon !== null)
        .map((d) => {
          const intensity =
            d.overall_severity === "severe"
              ? 1.0
              : d.overall_severity === "moderate"
              ? 0.6
              : 0.3;
          return [d.lat!, d.lon!, intensity] as [number, number, number];
        });

      if (points.length > 0) {
        // @ts-ignore — leaflet.heat extends L
        const heat = L.heatLayer(points, {
          radius: 25,
          blur: 20,
          maxZoom: 17,
          gradient: {
            0.2: "#6366f1",
            0.4: "#06b6d4",
            0.6: "#22c55e",
            0.8: "#f59e0b",
            1.0: "#ef4444",
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [detections, map]);

  return null;
}

// ─── Map Fly-To Handler ───────────────────────────────────────
function FlyToDetection({
  detection,
}: {
  detection: Detection | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (detection && detection.lat && detection.lon) {
      map.flyTo([detection.lat, detection.lon], 16, { duration: 1.2 });
    }
  }, [detection, map]);

  return null;
}

// ─── Main Map Component ──────────────────────────────────────
interface MapViewProps {
  detections: Detection[];
  selectedDetection?: Detection | null;
  onDetectionClick?: (detection: Detection) => void;
}

export default function MapView({
  detections,
  selectedDetection,
  onDetectionClick,
}: MapViewProps) {
  // Default center: Goa, India
  const defaultCenter: [number, number] = [15.45, 73.88];
  const defaultZoom = 11;

  // Calculate bounds from detections
  const validDetections = detections.filter(
    (d) => d.lat !== null && d.lon !== null
  );

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Dark-themed tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap layer */}
        <HeatmapLayer detections={validDetections} />

        {/* Fly to selected detection */}
        <FlyToDetection detection={selectedDetection || null} />

        {/* Individual markers */}
        {validDetections.map((detection) => (
          <Marker
            key={detection.id}
            position={[detection.lat!, detection.lon!]}
            icon={createMarkerIcon(detection.overall_severity)}
            eventHandlers={{
              click: () => onDetectionClick?.(detection),
            }}
          >
            <Popup>
              <div className="popup-content">
                <div className="popup-title">
                  <span className={`severity-badge ${detection.overall_severity}`}>
                    {detection.overall_severity}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    #{detection.id}
                  </span>
                </div>

                <div className="popup-detail">
                  <span>Confidence</span>
                  <strong>{(detection.max_confidence * 100).toFixed(0)}%</strong>
                </div>
                <div className="popup-detail">
                  <span>Detections</span>
                  <strong>{detection.detection_count}</strong>
                </div>
                <div className="popup-detail">
                  <span>Status</span>
                  <strong>
                    <span className={`status-badge ${detection.status}`}>
                      {detection.status.replace("_", " ")}
                    </span>
                  </strong>
                </div>
                <div className="popup-detail">
                  <span>Location</span>
                  <strong>
                    {detection.lat?.toFixed(4)}°, {detection.lon?.toFixed(4)}°
                  </strong>
                </div>
                <div className="popup-detail">
                  <span>Time</span>
                  <strong>{new Date(detection.timestamp).toLocaleDateString()}</strong>
                </div>

                <img
                  src={getImageUrl(detection.annotated_image_url)}
                  alt="Annotated detection"
                  className="popup-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
