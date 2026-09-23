"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function LiveDetectPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<"connecting" | "live" | "lost" | "permission_denied">("connecting");
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [detections, setDetections] = useState<any[]>([]);

  useEffect(() => {
    let stream: MediaStream;
    let watchId: number;
    let currentPos: { lat: number; lng: number; accuracy: number } | null = null;
    let intervalId: NodeJS.Timeout;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            currentPos = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
          },
          (err) => console.warn("Geolocation error:", err),
          { enableHighAccuracy: true }
        );

        const ws = new WebSocket("ws://localhost:8000/ws/live-detect");
        wsRef.current = ws;

        ws.onopen = () => setStatus("live");
        ws.onclose = () => setStatus("lost");
        ws.onerror = () => setStatus("lost");
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.boxes) {
            setDetections(data.boxes);
            if (data.boxes.length > 0) {
              setConfirmedCount(c => c + 1);
            }
          }
        };

        intervalId = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64Frame = canvas.toDataURL("image/jpeg", 0.6);
                ws.send(JSON.stringify({
                  frame: base64Frame,
                  lat: currentPos?.lat,
                  lng: currentPos?.lng,
                  accuracy: currentPos?.accuracy,
                  timestamp: new Date().toISOString(),
                }));
              }
            }
          }
        }, 1500);

      } catch (err) {
        console.error("Initialization error:", err);
        setStatus("permission_denied");
      }
    };

    init();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (wsRef.current) wsRef.current.close();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const getStatusColor = () => {
    switch(status) {
      case "live": return "#4caf50";
      case "connecting": return "#ff9800";
      case "lost": return "#f44336";
      case "permission_denied": return "#f44336";
      default: return "#999";
    }
  };

  const drawOverlays = () => {
    if (!videoRef.current) return null;
    const { videoWidth, videoHeight, clientWidth, clientHeight } = videoRef.current;
    if (videoWidth === 0 || videoHeight === 0) return null;

    const scaleX = clientWidth / videoWidth;
    const scaleY = clientHeight / videoHeight;

    return detections.map((det, idx) => {
      const left = det.x1 * scaleX;
      const top = det.y1 * scaleY;
      const width = (det.x2 - det.x1) * scaleX;
      const height = (det.y2 - det.y1) * scaleY;
      
      const color = det.severity === 'severe' ? '#ef4444' : det.severity === 'moderate' ? '#f97316' : '#22c55e';

      return (
        <div key={idx} style={{
          position: 'absolute',
          left, top, width, height,
          border: `3px solid ${color}`,
          borderRadius: '4px',
          pointerEvents: 'none',
          boxShadow: `0 0 10px ${color}80`
        }}>
          <div style={{
            position: 'absolute',
            top: '-24px', left: '-3px',
            backgroundColor: color,
            color: 'white',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '4px 4px 0 0',
            whiteSpace: 'nowrap'
          }}>
            {det.class_name} {Math.round(det.confidence * 100)}% | Risk: {Math.round((det.risk_score || 0) * 100)}%
          </div>
        </div>
      );
    });
  };

  const drawPriorityAlert = () => {
    if (detections.length === 0) return null;
    
    const highestRiskDet = [...detections].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))[0];
    const riskPercent = Math.round((highestRiskDet.risk_score || 0) * 100);
    
    if (riskPercent === 0) return null;

    const isHighPriority = riskPercent >= 15;

    return (
      <div style={{
        position: 'absolute',
        top: '20px', right: '20px',
        backgroundColor: isHighPriority ? 'rgba(239, 68, 68, 0.9)' : 'rgba(30, 41, 59, 0.9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${isHighPriority ? '#f87171' : '#475569'}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
          Priority Target
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {isHighPriority ? '⚠️ CRITICAL IMPACT' : 'LOW IMPACT'}
        </div>
        <div style={{ fontSize: '14px' }}>
          Area Risk: <span style={{ fontWeight: 'bold', color: isHighPriority ? '#fecaca' : '#38bdf8' }}>{riskPercent}%</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        padding: '20px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Live Detection</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 10px ${getStatusColor()}`
            }} />
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
              {status.replace('_', ' ')}
            </span>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '20px', fontWeight: 600 }}>
            Detections: {confirmedCount}
          </div>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {status === "permission_denied" ? (
          <div style={{ padding: '40px', background: '#331b26', borderRadius: '12px', border: '1px solid #7f1d1d', textAlign: 'center', marginTop: '40px' }}>
            <h2 style={{ color: '#fca5a5', marginTop: 0 }}>Camera Permission Denied</h2>
            <p>Please allow camera access to use the live detection feature.</p>
          </div>
        ) : (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '800px', 
            aspectRatio: '16/9',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid #1e293b'
          }}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {drawOverlays()}
            {drawPriorityAlert()}
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div style={{ marginTop: '30px', textAlign: 'center', color: '#94a3b8', maxWidth: '600px' }}>
          <p>Mount your device on the dashboard. The system will automatically detect road damage and stream it to the backend for ticketing.</p>
        </div>
      </main>
    </div>
  );
}
