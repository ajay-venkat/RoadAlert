"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import FilterPanel from "@/components/FilterPanel";
import StatsPanel from "@/components/StatsPanel";
import DetectionCard from "@/components/DetectionCard";
import {
  Detection,
  DetectionFilters,
  Stats,
  getDetections,
  getStats,
} from "@/lib/api";

// Dynamic import for Map (no SSR — Leaflet needs window)
const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map-container" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-secondary)",
    }}>
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading map...</span>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState<DetectionFilters>({ limit: 100 });
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDetections(filters);
      setDetections(response.detections);
    } catch (err) {
      // Avoid console.error to prevent Next.js red overlay popup in dev mode
      // console.error("Failed to fetch detections:", err);
      setError("Unable to connect to backend API. Make sure the server is running on http://localhost:8000");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (err) {
      // Suppress error log to prevent dev overlay
      // console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchDetections();
    fetchStats();
  }, [fetchDetections, fetchStats]);

  const handleFilterChange = (newFilters: DetectionFilters) => {
    setFilters({ ...newFilters, limit: 100 });
  };

  const handleDetectionClick = (detection: Detection) => {
    setSelectedDetection(detection);
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="dashboard-layout">
          <MapView
            detections={detections}
            selectedDetection={selectedDetection}
            onDetectionClick={handleDetectionClick}
          />
          <aside className="sidebar">
            <StatsPanel stats={stats} loading={!stats} />
            <FilterPanel filters={filters} onChange={handleFilterChange} />
            <div style={{ padding: "8px 12px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="sidebar-section-title" style={{ margin: 0 }}>Detections</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{detections.length} results</span>
            </div>
            <div className="detection-list">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <span>Loading detections...</span>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⚠️</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{error}</p>
                  <button onClick={fetchDetections} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--gradient-primary)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry</button>
                </div>
              ) : detections.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No detections found matching your filters.</p>
                </div>
              ) : (
                detections.map((detection) => (
                  <DetectionCard key={detection.id} detection={detection} onClick={handleDetectionClick} />
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
