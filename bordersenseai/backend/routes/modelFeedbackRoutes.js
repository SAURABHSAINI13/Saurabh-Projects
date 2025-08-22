// backend/routes/modelFeedbackRoutes.js
import express from 'express';
import { submitFeedback, getAlertFeedback, getUserFeedback, getFeedbackStats } from '../controllers/modelFeedbackController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/feedback
 * @desc Submit feedback for an AI model detection
 * @access Private
 */
router.post('/', authenticate, submitFeedback);

/**
 * @route GET /api/feedback/alert/:alertId
 * @desc Get feedback for a specific alert
 * @access Private
 */
router.get('/alert/:alertId', authenticate, getAlertFeedback);

/**
 * @route GET /api/feedback/user
 * @desc Get all feedback submitted by the current user
 * @access Private
 */
router.get('/user', authenticate, getUserFeedback);

/**
 * @route GET /api/feedback/stats
 * @desc Get feedback statistics
 * @access Private (Admin/Analyst)
 */
router.get('/stats', authenticate, checkRole(['admin', 'analyst']), getFeedbackStats);

export default router;