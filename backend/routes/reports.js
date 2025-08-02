import express from 'express';
import IncidentReport from '../models/IncidentReport.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const report = new IncidentReport(req.body);
  await report.save();
  res.status(201).json(report);
});

export default router;
