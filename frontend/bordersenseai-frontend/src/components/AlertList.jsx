import { useEffect, useState } from 'react';
import { request } from '../api/client.js';

export default function AlertList() {
  const [alerts, setAlerts] = useState([]);

  const load = async () => {
    try {
      const data = await request('/alerts');
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Active Alerts</h3>
      <ul>
        {alerts.map(a => (
          <li key={a._id}>
            <strong>{a.type}</strong> [{a.severity}] - {a.status} - Confidence: {a.confidence.toFixed(2)}
            <br />
            Location: {a.geo?.lat}, {a.geo?.lon} at {new Date(a.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
