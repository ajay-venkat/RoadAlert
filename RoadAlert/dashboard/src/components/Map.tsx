"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Report } from "@/lib/supabase";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create custom colored icons based on status
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const icons = {
  'New': createIcon("#E6552E"), // Hazard Orange
  'In Progress': createIcon("#F4C430"), // Lane Yellow
  'Resolved': createIcon("#4C8B6B"), // Cleared Green
};

// Component to handle map center changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface MapProps {
  reports: Report[];
  selectedReport: Report | null;
}

export default function Map({ reports, selectedReport }: MapProps) {
  // Center roughly on Chennai
  const defaultCenter: [number, number] = [13.11, 80.29];
  const center = selectedReport ? [selectedReport.lat, selectedReport.lon] as [number, number] : defaultCenter;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-slate-700/50"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView center={center} />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lon]}
            icon={icons[report.status]}
          >
            <Popup className="custom-popup">
              <div className="flex flex-col gap-2 p-1">
                <div className="font-semibold text-slate-800">
                  Ticket #{report.id.substring(0, 8)}
                </div>
                <div className="text-xs text-slate-500">
                  {report.constituencies?.name}
                </div>
                {report.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.photo_url}
                    alt="Road Issue"
                    className="w-full h-24 object-cover rounded-md mt-1"
                  />
                )}
                <div className={`mt-1 text-xs font-bold px-2 py-1 rounded-full text-center uppercase tracking-wide
                  ${report.status === 'New' ? 'bg-[#E6552E]/10 text-[#E6552E]' : 
                    report.status === 'In Progress' ? 'bg-[#F4C430]/20 text-[#D4A017]' : 
                    'bg-[#4C8B6B]/10 text-[#4C8B6B]'}`
                }>
                  {report.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
