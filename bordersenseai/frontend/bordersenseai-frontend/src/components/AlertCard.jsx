// frontend/src/components/AlertCard.jsx
import React from 'react';

export default function AlertCard({ alert, onAcknowledge, onDismiss, onSelect }) {
  return (
    <div className="card alert" onClick={() => onSelect && onSelect(alert)} style={{ cursor: 'pointer' }}>
      <div className="title">
        <div>
          <strong>{alert.type}</strong>{' '}
          <span className={`badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
        </div>
        <div className="small">{new Date(alert.timestamp).toLocaleTimeString()}</div>
      </div>
      <div>Location: {alert.geo?.lat}, {alert.geo?.lon}</div>
      <div className="flex" style={{ gap: 8, marginTop: 8 }}>
        <button
          className="button"
          onClick={(e) => {
            e.stopPropagation();
            onAcknowledge(alert._id);
          }}
          disabled={alert.status === 'Acknowledged'}
        >
          Acknowledge
        </button>
        <button
          className="button secondary"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(alert._id);
          }}
          disabled={alert.status === 'Dismissed'}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
