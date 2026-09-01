"use client";

import { DetectionFilters } from "@/lib/api";

interface FilterPanelProps {
  filters: DetectionFilters;
  onChange: (filters: DetectionFilters) => void;
}

const SEVERITIES = ["all", "minor", "moderate", "severe"] as const;
const STATUSES = ["all", "reported", "in_progress", "fixed"] as const;

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const activeSeverity = filters.severity || "all";
  const activeStatus = filters.status || "all";

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Filters</div>

      {/* Severity filter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
          Severity
        </div>
        <div className="filter-group">
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              className={`filter-chip ${activeSeverity === sev ? `active ${sev}` : ""}`}
              onClick={() =>
                onChange({
                  ...filters,
                  severity: sev === "all" ? undefined : sev,
                })
              }
            >
              {sev === "all" ? "All" : sev === "minor" ? "🟢 Minor" : sev === "moderate" ? "🟠 Moderate" : "🔴 Severe"}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
          Status
        </div>
        <div className="filter-group">
          {STATUSES.map((st) => (
            <button
              key={st}
              className={`filter-chip ${activeStatus === st ? `active ${st}` : ""}`}
              onClick={() =>
                onChange({
                  ...filters,
                  status: st === "all" ? undefined : st,
                })
              }
            >
              {st === "all" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
          Date Range
        </div>
        <div className="filter-date-row">
          <input
            type="date"
            className="filter-input"
            value={filters.start_date || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                start_date: e.target.value || undefined,
              })
            }
            placeholder="From"
          />
          <input
            type="date"
            className="filter-input"
            value={filters.end_date || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                end_date: e.target.value || undefined,
              })
            }
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
