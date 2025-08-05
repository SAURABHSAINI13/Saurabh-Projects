// src/components/IncidentReportForm.jsx
import { useState } from 'react';
import { request } from '../api/client.js';

export default function IncidentReportForm({ alertId, onReported }) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!alertId) return alert('No alert selected');
    setSubmitting(true);
    try {
      await request('/incident-report', {
        method: 'POST',
        body: JSON.stringify({
          alertId,
          description,
          confirmedBy: JSON.parse(atob(localStorage.getItem('access_token').split('.')[1])).id,
        }),
      });
      alert('Incident reported');
      setDescription('');
      if (onReported) onReported();
    } catch (e) {
      console.error('Report error', e);
      alert('Failed to report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
      <h3>Incident Report</h3>
      <div>
        <label>
          Alert ID: <strong>{alertId || 'None selected'}</strong>
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <textarea
          placeholder="Describe what happened / confirmation"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
          required
        />
      </div>
      <button type="submit" disabled={submitting || !alertId} style={{ marginTop: 8 }}>
        {submitting ? 'Reporting...' : 'Submit Report'}
      </button>
    </form>
  );
}
