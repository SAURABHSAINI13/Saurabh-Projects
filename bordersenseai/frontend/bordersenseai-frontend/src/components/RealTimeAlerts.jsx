// src/components/RealTimeAlerts.jsx
import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function RealTimeAlerts({ onNewAlert }) {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    const handleNewAlert = (alert) => {
      console.log('Realtime alert received', alert);
      setLatest(alert);
      if (onNewAlert) onNewAlert(alert);
    };

    socket.on('new-alert', handleNewAlert);

    return () => {
      socket.off('new-alert', handleNewAlert);
    };
  }, [onNewAlert]);

  if (!latest) return null;

  return (
    <div style={{ background: '#fffbcc', padding: 10, border: '1px solid #e5d500', marginBottom: 12 }}>
      <strong>New alert:</strong> {latest.type} [{latest.severity}] at{' '}
      {new Date(latest.timestamp).toLocaleTimeString()}
    </div>
  );
}
