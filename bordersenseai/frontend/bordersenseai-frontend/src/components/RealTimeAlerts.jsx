// src/components/RealTimeAlerts.jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function RealTimeAlerts({ onNewAlert }) {
  const [socket, setSocket] = useState(null);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001');
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket connected', s.id);
    });

    s.on('new-alert', (alert) => {
      console.log('Realtime alert received', alert);
      setLatest(alert);
      if (onNewAlert) onNewAlert(alert);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  if (!latest) return null;

  return (
    <div style={{ background: '#fffbcc', padding: 10, border: '1px solid #e5d500', marginBottom: 12 }}>
      <strong>New alert:</strong> {latest.type} [{latest.severity}] at{' '}
      {new Date(latest.timestamp).toLocaleTimeString()}
    </div>
  );
}
