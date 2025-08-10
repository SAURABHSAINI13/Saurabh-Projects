// backend/routes/assetRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  addSensorReading,
  addMaintenanceRecord,
  updateLocation,
  getMaintenanceDueAssets
} from '../controllers/assetController.js';

const router = express.Router();

// Role-based authentication middleware
const authenticateToken = (rolesAllowed = []) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      if (rolesAllowed.length && !rolesAllowed.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      req.user = user;
      next();
    });
  };
};

// =============================
// Asset Management Routes
// =============================

// GET all assets
router.get(
  '/',
  authenticateToken(['field_officer', 'command_officer', 'admin']),
  listAssets
);

// GET maintenance due assets
router.get(
  '/maintenance-due',
  authenticateToken(['command_officer', 'admin']),
  getMaintenanceDueAssets
);

// GET single asset
router.get(
  '/:id',
  authenticateToken(['field_officer', 'command_officer', 'admin']),
  getAsset
);

// CREATE asset
router.post(
  '/',
  authenticateToken(['command_officer', 'admin']),
  createAsset
);

// UPDATE asset
router.put(
  '/:id',
  authenticateToken(['command_officer', 'admin']),
  updateAsset
);

// DELETE asset
router.delete(
  '/:id',
  authenticateToken(['admin']),
  deleteAsset
);

// =============================
// Asset Data Collection Routes
// =============================
router.post(
  '/:id/sensor-reading',
  authenticateToken(['field_officer', 'command_officer', 'admin']),
  addSensorReading
);

router.post(
  '/:id/maintenance',
  authenticateToken(['command_officer', 'admin']),
  addMaintenanceRecord
);

router.post(
  '/:id/location',
  authenticateToken(['field_officer', 'command_officer', 'admin']),
  updateLocation
);

// =============================
// Asset Request Route (Inline Logic)
// =============================
router.post(
  '/request',
  authenticateToken(['field_officer', 'command_officer', 'admin']),
  async (req, res) => {
    try {
      const { type, quantity, requestType, description, isInjured } = req.body;
      if (!type || !requestType) {
        return res.status(400).json({ error: 'Type and requestType required' });
      }

      const asset = await mongoose.model('Asset').create({
        name: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request`,
        type: requestType === 'medical' ? 'medical' : 'equipment',
        status: 'in-use',
        quantity: quantity || 1,
        requestedBy: req.user.id,
        requestType,
        description,
        isInjured: requestType === 'medical' ? isInjured : false,
        location: { type: 'Point', coordinates: [77.0, 34.0] }, // Example coordinates
      });

      req.app.get('io').emit('new_asset', asset);
      res.status(201).json(asset);
    } catch (err) {
      console.error('POST /api/assets/request error:', err);
      res.status(500).json({ error: 'Failed to request asset' });
    }
  }
);

export default router;
