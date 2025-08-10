import express from 'express';
import PatrolRoute from '../models/PatrolRoute.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/optimize', authenticate, async (req, res) => {
  const { regionId } = req.query;
  // placeholder: generate a dummy optimized route
  const dummyRoute = {
    waypoints: [
      { lat: 34.0, lon: 77.0, eta: new Date(Date.now() + 5 * 60000) },
      { lat: 34.1, lon: 77.1, eta: new Date(Date.now() + 15 * 60000) },
    ],
    optimizationScore: 0.92,
    assignedTo: null,
    regionId,
  };
  res.json(dummyRoute);
});

router.post('/assign', authenticate, async (req, res) => {
  const { routeId, officerId } = req.body;
  const route = await PatrolRoute.findById(routeId);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  route.assignedTo = officerId;
  await route.save();
  res.json(route);
});

export default router;



