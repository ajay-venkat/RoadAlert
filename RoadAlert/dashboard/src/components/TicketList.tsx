"use client";

import { useState } from "react";
import { Report } from "@/lib/supabase";
import { format } from "date-fns";

interface TicketListProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (report: Report) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function TicketList({ reports, selectedReportId, onSelectReport, onUpdateStatus }: TicketListProps) {
  const [filter, setFilter] = useState<string>('All');

  const filteredReports = filter === 'All' 
    ? reports 
    : reports.filter(r => r.status === filter);

  return (
    <div className="flex flex-col h-full bg-background border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-white">
        <h2 className="font-display text-2xl font-bold tracking-wide text-foreground mb-4">REPORTS</h2>
        
        {/* Filters */}
        <div className="flex gap-2 mb-2">
          {['All', 'New', 'In Progress', 'Resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors
                ${filter === status 
                  ? 'bg-foreground text-background' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredReports.map(report => (
          <div 
            key={report.id}
            onClick={() => onSelectReport(report)}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm
              ${selectedReportId === report.id 
                ? 'border-accent bg-accent/5 ring-2 ring-accent/20' 
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-sm font-semibold text-slate-600">
                #{report.id.substring(0, 8)}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide
                ${report.status === 'New' ? 'bg-[#E6552E]/10 text-[#E6552E]' : 
                  report.status === 'In Progress' ? 'bg-[#F4C430]/20 text-[#D4A017]' : 
                  'bg-[#4C8B6B]/10 text-[#4C8B6B]'}`}
              >
                {report.status}
              </span>
            </div>
            
            <div className="font-body text-slate-800 font-medium mb-1">
              {report.constituencies?.name || 'Unknown Location'}
            </div>
            
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
              <span className="opacity-70">Reported on</span> {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
            </div>

            {report.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={report.photo_url} 
                alt="Issue" 
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            <div className="dashed-lane my-3"></div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Update Status:</span>
              <select 
                value={report.status}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(report.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border border-slate-200 rounded p-1 font-medium bg-slate-50 focus:ring-accent focus:border-accent"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center text-slate-500 py-10 font-medium">
            No reports found.
          </div>
        )}
      </div>
    </div>
  );
}
