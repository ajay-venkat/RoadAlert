"use client";

import { Stats } from "@/lib/api";

interface StatsPanelProps {
  stats: Stats | null;
  loading?: boolean;
}

export default function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading || !stats) {
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-title">Overview</div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card" style={{ animation: "pulse 1.5s infinite" }}>
              <div className="stat-value total" style={{ opacity: 0.3 }}>--</div>
              <div className="stat-label">Loading</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Overview</div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value total">{stats.total_detections}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value severe">{stats.by_severity?.severe || 0}</div>
          <div className="stat-label">Severe</div>
        </div>
        <div className="stat-card">
          <div className="stat-value moderate">{stats.by_severity?.moderate || 0}</div>
          <div className="stat-label">Moderate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value minor">{stats.by_severity?.minor || 0}</div>
          <div className="stat-label">Minor</div>
        </div>
      </div>
    </div>
  );
}
