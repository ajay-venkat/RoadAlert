"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Detection } from "../../lib/api";

export default function StaffDashboard() {
  const [constituencyId, setConstituencyId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tickets, setTickets] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (constituencyId.trim()) {
      setIsLoggedIn(true);
      fetchTickets(constituencyId);
    }
  };

  const fetchTickets = async (cid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets?constituency_id=${cid}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.detections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <form onSubmit={login} style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '400px' }}>
          <h2 style={{ marginTop: 0 }}>MLA Staff Login</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Enter your constituency ID (e.g. TN-011 or TN-012)</p>
          <input 
            type="text" 
            value={constituencyId}
            onChange={e => setConstituencyId(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px', marginBottom: '20px' }}
            placeholder="Constituency ID"
            required
          />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'fixed') return '#22c55e';
    if (status === 'in_progress') return '#eab308';
    return '#f43f5e';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Staff Dashboard - {constituencyId}</h1>
        <button onClick={() => setIsLoggedIn(false)} style={{ background: 'transparent', border: '1px solid #334155', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </header>
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? <p>Loading tickets...</p> : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {tickets.length === 0 ? <p>No tickets found for this constituency.</p> : tickets.map(t => (
              <Link href={`/staff/${t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Ticket #{t.id.substring(0,8)}</h3>
                    <div style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', gap: '15px' }}>
                      <span>Reported: {new Date(t.timestamp).toLocaleDateString()}</span>
                      <span>Severity: <strong style={{ textTransform: 'capitalize', color: t.overall_severity === 'severe' ? '#ef4444' : t.overall_severity === 'moderate' ? '#f97316' : '#22c55e' }}>{t.overall_severity}</strong></span>
                      <span>Confirmations: {(t as any).confirmation_count || 1}</span>
                    </div>
                  </div>
                  <div style={{ background: getStatusColor(t.status) + '20', color: getStatusColor(t.status), padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {t.status.replace('_', ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
