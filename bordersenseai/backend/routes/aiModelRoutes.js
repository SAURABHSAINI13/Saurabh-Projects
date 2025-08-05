// backend/routes/aiModelRoutes.js
import express from 'express';
import {
  listModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  addMetrics,
  addVersion,
  recordFeedback,
  getModelsNeedingRetraining
} from '../controllers/aiModelController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all AI model routes
router.use(authenticate);

// AI model management routes
router.get('/', listModels);
router.get('/needs-retraining', getModelsNeedingRetraining);
router.get('/:id', getModel);
router.post('/', createModel);
router.put('/:id', updateModel);
router.delete('/:id', deleteModel);

// AI model data collection routes
router.post('/:id/metrics', addMetrics);
router.post('/:id/version', addVersion);
router.post('/:id/feedback', recordFeedback);

export default router;