// backend/routes/users.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { listUsers } from '../controllers/userController.js';

const router = express.Router();

// Only commanders, planners, or admins can list users
router.get('/', authenticate, authorizeRoles('PatrolCommander', 'CentralPlanner', 'DirectorGeneral'), listUsers);

export default router;
