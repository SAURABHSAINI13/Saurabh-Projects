// src/components/FeedbackForm.jsx
import { useState } from 'react';
import { request } from '../api/client.js';

export default function FeedbackForm({ alert, onSubmitted }) {
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!alert) return <div>Select an alert to give feedback.</div>;

  const submit = async (e) => {
    e.preventDefault();
    if (!correctedLabel) return alert('Corrected label required');

    setSubmitting(true);
    try {
      await request('/models/feedback', {
        method: 'POST',
        body: JSON.stringify({
          alertId: alert._id,
          correctedLabel,
          comments,
        }),
      });
      alert('Feedback submitted');
      setCorrectedLabel('');
      setComments('');
      if (onSubmitted) onSubmitted();
    } catch (e) {
      console.error('Feedback submit error', e);
      alert('Failed to submit feedback: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ border: '1px solid #aaa', padding: 12, marginTop: 12 }}>
      <h4>Model Feedback for Alert: {alert.type} [{alert.severity}]</h4>
      <div>
        <label>
          Corrected Label:{' '}
          <input
            value={correctedLabel}
            onChange={(e) => setCorrectedLabel(e.target.value)}
            placeholder="e.g., FalsePositive"
            required
          />
        </label>
      </div>
      <div style={{ marginTop: 6 }}>
        <label>
          Comments:<br />
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
            placeholder="Why was the original classification wrong?"
          />
        </label>
      </div>
      <button type="submit" disabled={submitting} style={{ marginTop: 8 }}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
