// backend/routes/reports.js
import express from 'express';
import IncidentReport from '../models/IncidentReport.js';
import { authenticate } from '../middleware/auth.js';
import { createReport } from '../controllers/reportController.js';

const router = express.Router();
router.get('/', (req, res) => {
  res.json({ message: 'Reports endpoint working' });
});
router.post('/', authenticate, createReport);
export default router;
