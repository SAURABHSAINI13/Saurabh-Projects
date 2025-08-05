import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import {
  listAlerts,
  acknowledgeAlert,
  createAlert,
} from '../controllers/alertController.js';

const router = express.Router();

router.get('/', authenticate, listAlerts);
router.post('/:id/acknowledge', authenticate, acknowledgeAlert);
router.post(
  '/create',
  authenticate,
  authorizeRoles('DroneOperator', 'IntelligenceAnalyst', 'PatrolCommander'),
  createAlert
);
export default router;