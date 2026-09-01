// Copy this content into RoadAlert/dashboard/src/app/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Report } from "@/lib/supabase";
import TicketList from "@/components/TicketList";

// Dynamically import map to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">Loading map...</div>
});

const MOCK_REPORTS: Report[] = [
  {
    id: "uuid-1",
    photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
    lat: 13.0827,
    lon: 80.2707,
    constituency_id: "const-1",
    status: "New",
    created_at: new Date().toISOString(),
    constituencies: { name: "Anna Nagar", mla_name: "MK Mohan" }
  },
  {
    id: "uuid-2",
    photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
    lat: 13.0405,
    lon: 80.2337,
    constituency_id: "const-2",
    status: "In Progress",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    constituencies: { name: "T. Nagar", mla_name: "J. Karunanithi" }
  },
  {
    id: "uuid-3",
    photo_url: null as any,
    lat: 13.0100,
    lon: 80.2100,
    constituency_id: "const-2",
    status: "Resolved",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    constituencies: { name: "T. Nagar", mla_name: "J. Karunanithi" }
  }
];

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: newStatus as any } : r
    ));
  };

  const selectedReport = reports.find(r => r.id === selectedReportId) || null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
      {/* Map Area */}
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200">
          <h1 className="font-display text-2xl font-bold tracking-wide text-foreground">RoadAlert <span className="text-slate-400 font-medium text-lg">| MLA Dashboard</span></h1>
        </div>
        <MapWithNoSSR reports={reports} selectedReport={selectedReport} />
      </div>

      {/* Sidebar List */}
      <div className="w-[400px] h-full shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-[1000]">
        <TicketList 
          reports={reports} 
          selectedReportId={selectedReportId}
          onSelectReport={(r) => setSelectedReportId(r.id)}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
}
