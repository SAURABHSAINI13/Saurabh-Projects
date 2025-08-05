import Feedback from '../models/Feedback.js';
import { enqueueRetrainingJob } from '../services/retrainingQueue.js'; // placeholder, implement separately

export const submitFeedback = async (req, res) => {
  try {
    const { alertId, correctedLabel, comments, originalPrediction } = req.body;
    if (!alertId || !correctedLabel) {
      return res.status(400).json({ error: 'alertId and correctedLabel are required' });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Prevent duplicate feedback from same user for same alert
    const existing = await Feedback.findOne({
      alertId,
      submittedBy: req.user.id,
    });

    if (existing) {
      // Optionally allow updating existing feedback instead of blocking:
      // existing.correctedLabel = correctedLabel;
      // existing.comments = comments || existing.comments;
      // await existing.save();
      return res.status(409).json({ error: 'Feedback for this alert by you already exists' });
    }

    const feedback = new Feedback({
      alertId,
      submittedBy: req.user.id,
      correctedLabel,
      comments,
      originalPrediction,
    });

    await feedback.save();

    // Enqueue for retraining / processing (implementation can be e.g., message broker, job queue)
    try {
      await enqueueRetrainingJob(feedback._id);
    } catch (queueErr) {
      console.warn('Failed to enqueue retraining job, will retry later:', queueErr);
      // don't fail the request; mark in logs or flag for retry mechanism
    }

    res.status(201).json({
      message: 'Feedback recorded',
      feedbackId: feedback._id,
    });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};
