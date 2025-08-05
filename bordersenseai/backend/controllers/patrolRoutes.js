// backend/routes/patrolRoutes.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { optimizeRoute, assignRoute } from '../controllers/routeController.js';
import patrolRoutes from './routes/patrolRoutes.js';
app.use('/api/routes', patrolRoutes);
const router = express.Router();

router.get('/optimize', authenticate, authorizeRoles('PatrolCommander', 'CentralPlanner'), optimizeRoute);
router.post('/assign', authenticate, authorizeRoles('PatrolCommander'), assignRoute);

export default router;
