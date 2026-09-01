"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import Navbar from "@/components/Navbar";
import { Stats, getStats } from "@/lib/api";

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#22c55e",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "#6366f1",
  in_progress: "#f59e0b",
  fixed: "#22c55e",
};

// Custom tooltip component for dark theme
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "#f1f5f9",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        // Suppress error log to prevent dev overlay
        // console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="analytics-container">
          <div className="loading-container" style={{ minHeight: 400 }}>
            <div className="loading-spinner" />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const severityPieData = Object.entries(stats.by_severity).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SEVERITY_COLORS[name] || "#6366f1",
  }));

  const statusBarData = Object.entries(stats.by_status).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
    fill: STATUS_COLORS[name] || "#6366f1",
  }));

  const trendData = stats.daily_trend.map((d) => ({
    date: d.date.slice(5), // MM-DD format
    count: d.count,
  }));

  return (
    <div className="app-container">
      <Navbar />

      <div className="analytics-container animate-in">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
          <p>Aggregated insights from all pothole detections</p>
        </div>

        {/* Summary Cards */}
        <div className="analytics-grid">
          <div className="analytics-stat-card total">
            <div
              className="analytics-stat-value"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {stats.total_detections}
            </div>
            <div className="analytics-stat-label">Total Detections</div>
          </div>
          <div className="analytics-stat-card severe">
            <div className="analytics-stat-value" style={{ color: "#ef4444" }}>
              {stats.by_severity?.severe || 0}
            </div>
            <div className="analytics-stat-label">Severe</div>
          </div>
          <div className="analytics-stat-card moderate">
            <div className="analytics-stat-value" style={{ color: "#f59e0b" }}>
              {stats.by_severity?.moderate || 0}
            </div>
            <div className="analytics-stat-label">Moderate</div>
          </div>
          <div className="analytics-stat-card minor">
            <div className="analytics-stat-value" style={{ color: "#22c55e" }}>
              {stats.by_severity?.minor || 0}
            </div>
            <div className="analytics-stat-label">Minor</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          {/* Severity Distribution Pie */}
          <div className="chart-card">
            <div className="chart-card-title">Severity Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
              {severityPieData.map((entry) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: entry.color,
                  }} />
                  <span style={{ color: "var(--text-secondary)" }}>{entry.name}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="chart-card">
            <div className="chart-card-title">Status Breakdown</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusBarData} layout="vertical" barSize={24}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(99, 102, 241, 0.08)"
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Trend Area Chart (full width) */}
          <div className="chart-card chart-card-full">
            <div className="chart-card-title">Detection Trend (Last 30 Days)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(99, 102, 241, 0.08)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(99, 102, 241, 0.12)" }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(99, 102, 241, 0.12)" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#818cf8", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Confidence */}
        <div className="chart-card" style={{ marginBottom: 24, textAlign: "center", padding: 24 }}>
          <div className="chart-card-title">Model Performance</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#06b6d4", margin: "8px 0" }}>
            {(stats.avg_confidence * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Average Detection Confidence
          </div>
        </div>
      </div>
    </div>
  );
}
