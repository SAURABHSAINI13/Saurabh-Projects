// backend/controllers/routeController.js
import PatrolRoute from '../models/PatrolRoute.js';
import User from '../models/User.js'; // for validation if needed
import { generateOptimizedRoute } from '../services/patrolOptimizer.js';

/**
 * Generate an optimized patrol route for a region
 * Uses AI-enhanced patrol optimization algorithm
 */
export const optimizeRoute = async (req, res) => {
  try {
    const { regionId } = req.query;
    if (!regionId) return res.status(400).json({ error: 'regionId required' });
    
    // Optional constraints from request
    const constraints = {
      maxWaypoints: req.query.maxWaypoints ? parseInt(req.query.maxWaypoints) : 10,
      maxDistance: req.query.maxDistance ? parseInt(req.query.maxDistance) : null,
      maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : null,
      priorityLevel: req.query.priorityLevel || 'balanced' // 'safety', 'efficiency', 'balanced'
    };
    
    // Generate optimized route using the AI-enhanced optimizer
    const optimizedRoute = await generateOptimizedRoute(regionId, constraints);
    
    // Return the optimized route
    res.json({
      _id: optimizedRoute._id,
      waypoints: optimizedRoute.waypoints,
      optimizationScore: optimizedRoute.optimizationScore,
      regionId: optimizedRoute.regionId,
      aiModelUsed: optimizedRoute.aiModelUsed,
      createdAt: optimizedRoute.createdAt
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
};

export const assignRoute = async (req, res) => {
  try {
    const { routeId, officerId } = req.body;
    if (!routeId || !officerId) return res.status(400).json({ error: 'routeId and officerId required' });

    // Optionally validate officer exists
    const officer = await User.findById(officerId);
    if (!officer) return res.status(404).json({ error: 'Officer not found' });

    let route = await PatrolRoute.findById(routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    route.assignedTo = officerId;
    await route.save();

    res.json(route);
  } catch (err) {
    console.error('assignRoute error', err);
    res.status(500).json({ error: 'Failed to assign route' });
  }
};
