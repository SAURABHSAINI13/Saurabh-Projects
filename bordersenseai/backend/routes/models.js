// backend/routes/models.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { submitFeedback } from '../controllers/modelController.js';

const router = express.Router();

router.post('/feedback', authenticate, submitFeedback);
// Optionally: router.get('/status', authenticate, ...)

export default router;
