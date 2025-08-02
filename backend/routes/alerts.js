import express from 'express';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 }).limit(100);
  res.json(alerts);
});

router.post('/:id/acknowledge', authenticate, async (req, res) => {
  const { action, comment } = req.body; // action: acknowledge | dismiss
  const { id } = req.params;
  const alert = await Alert.findById(id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  if (action === 'acknowledge') alert.status = 'Acknowledged';
  else if (action === 'dismiss') alert.status = 'Dismissed';
  if (comment) alert.comments = comment;
  await alert.save();
  res.json(alert);
});

export default router;
