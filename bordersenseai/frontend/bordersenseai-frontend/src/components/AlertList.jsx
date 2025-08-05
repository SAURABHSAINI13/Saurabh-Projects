// src/components/AlertList.jsx
import { useEffect, useState, useCallback } from 'react';
import { request } from '../api/client.js';

function AlertItem({ alert, onAction }) {
  const { _id, type, severity, status, confidence, geo, timestamp } = alert;

  const handle = async (action, comment) => {
    try {
      await onAction(_id, action, comment);
    } catch (err) {
      alertUser(`Action "${action}" failed: ${err.message}`);
    }
  };

  const alertUser = (msg) => {
    // replace with your toast/notification system if available
    window.alert(msg);
  };

  return (
    <div className="alert-item">
      <div className="flex justify-between">
        <div>
          <strong>{type}</strong> 
          <span className={`badge ${severity.toLowerCase()}`}>{severity}</span>
        </div>
        <span className="tag">{status}</span>
      </div>
      
      <div className="small">Confidence: {typeof confidence === 'number' ? confidence.toFixed(2) : 'N/A'}</div>
      
      <div className="small">
        Location: {geo?.lat ?? '—'}, {geo?.lon ?? '—'} at{' '}
        {timestamp ? new Date(timestamp).toLocaleString() : '—'}
      </div>
      
      <div className="actions">
        <button
          className="button small"
          onClick={() => handle('acknowledge', 'Checked')}
          disabled={status === 'Acknowledged'}
        >
          Acknowledge
        </button>
        <button
          className="button small secondary"
          onClick={() => handle('dismiss', 'False alarm')}
          disabled={status === 'Dismissed'}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function AlertList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/alerts');
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load alerts', e);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [load]);

  const handleAction = useCallback(
    async (id, action, comment) => {
      await request(`/alerts/${id}/acknowledge`, {
        method: 'POST',
        body: { action, comment },
      });
      // refresh after action
      await load();
    },
    [load]
  );

  return (
    <div className="alerts-container">
      <h3>Active Alerts</h3>
      {loading && <div className="loading">Loading alerts...<div className="loading-spinner"></div></div>}
      {error && <div className="alert" style={{ borderLeftColor: 'var(--danger)' }}>{error}</div>}
      {!loading && alerts.length === 0 && <div className="small">No active alerts.</div>}
      <div className="alerts-list">
        {alerts.map((a) => (
          <AlertItem key={a._id} alert={a} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}
