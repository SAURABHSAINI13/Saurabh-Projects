// backend/routes/assetRoutes.js
import express from 'express';
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
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all asset routes
router.use(authenticate);

// Asset management routes
router.get('/', listAssets);
router.get('/maintenance-due', getMaintenanceDueAssets);
router.get('/:id', getAsset);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

// Asset data collection routes
router.post('/:id/sensor-reading', addSensorReading);
router.post('/:id/maintenance', addMaintenanceRecord);
router.post('/:id/location', updateLocation);

export default router;