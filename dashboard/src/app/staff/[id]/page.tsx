"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TicketDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/detections/${id}`)
      .then(res => res.json())
      .then(data => {
        setTicket(data);
        setLoading(false);
      });
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8000/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTicket({ ...ticket, status: newStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '40px', background: '#0f172a', minHeight: '100vh' }}>Loading...</div>;
  if (!ticket) return <div style={{ color: 'white', padding: '40px', background: '#0f172a', minHeight: '100vh' }}>Ticket not found</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '20px', fontSize: '16px' }}>
        ← Back to List
      </button>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        {ticket.image_url && (
          <div style={{ width: '100%', height: '400px', backgroundColor: '#000' }}>
            <img 
              src={`http://localhost:8000${ticket.image_url}`} 
              alt="Pothole" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        )}
        
        <div style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0' }}>Ticket #{ticket.id.substring(0,8)}</h1>
              <p style={{ color: '#94a3b8', margin: 0 }}>Reported on {new Date(ticket.timestamp).toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Status</span>
              <select 
                value={ticket.status} 
                onChange={(e) => updateStatus(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  background: '#0f172a', 
                  color: 'white', 
                  border: '1px solid #334155',
                  textTransform: 'capitalize'
                }}
              >
                <option value="reported">Reported</option>
                <option value="in_progress">In Progress</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
            <div>
              <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 5px 0' }}>Location</h3>
              <p style={{ margin: 0 }}>{ticket.lat ? `${ticket.lat.toFixed(5)}, ${ticket.lon.toFixed(5)}` : 'N/A'}</p>
              {ticket.lat && (
                <a href={`https://maps.google.com/?q=${ticket.lat},${ticket.lon}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none', display: 'inline-block', marginTop: '5px' }}>
                  View on Map
                </a>
              )}
            </div>
            <div>
              <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 5px 0' }}>Severity</h3>
              <p style={{ margin: 0, textTransform: 'capitalize' }}>{ticket.overall_severity}</p>
            </div>
            <div>
              <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 5px 0' }}>Confirmations</h3>
              <p style={{ margin: 0 }}>{ticket.confirmation_count || 1}</p>
            </div>
            <div>
              <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 5px 0' }}>Constituency</h3>
              <p style={{ margin: 0 }}>{ticket.constituency_name || ticket.constituency_id || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
