// backend/controllers/assetController.js
import Asset from '../models/Asset.js';
import { predictMaintenance } from '../services/maintenancePredictor.js';

/**
 * GET /assets
 * List assets with optional filtering and pagination
 */
export const listAssets = async (req, res) => {
  try {
    const { 
      type, status, region, assignedTo, 
      page = 1, perPage = 20, 
      sort = 'name', order = 'asc' 
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.deploymentRegion = region;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page, 10));
    const perPageNum = Math.min(100, Math.max(1, parseInt(perPage, 10)));

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .populate('assignedTo', 'name username')
        .lean(),
      Asset.countDocuments(filter)
    ]);

    res.json({
      meta: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
      },
      data: assets,
    });
  } catch (err) {
    console.error('Error listing assets:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

/**
 * GET /assets/:id
 * Get a single asset by ID
 */
export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'name username')
      .lean();

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

/**
 * POST /assets
 * Create a new asset
 */
export const createAsset = async (req, res) => {
  try {
    const assetData = req.body;

    // Validate required fields
    if (!assetData.name || !assetData.type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const asset = new Asset(assetData);
    const savedAsset = await asset.save();

    res.status(201).json(savedAsset);
  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

/**
 * PUT /assets/:id
 * Update an existing asset
 */
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find and update the asset
    const asset = await Asset.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

/**
 * DELETE /assets/:id
 * Delete an asset
 */
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByIdAndDelete(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    console.error('Error deleting asset:', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};

/**
 * POST /assets/:id/sensor-reading
 * Add a new sensor reading to an asset
 */
export const addSensorReading = async (req, res) => {
  try {
    const { id } = req.params;
    const readingData = req.body;

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await asset.addSensorReading(readingData);

    // After adding sensor data, check if maintenance prediction should be updated
    if (asset.sensorReadings.length % 10 === 0) { // Every 10 readings
      const prediction = predictMaintenance(asset);
      
      // Update asset with prediction results
      asset.maintenanceRisk = prediction.maintenanceRisk;
      asset.nextScheduledMaintenance = new Date(Date.now() + (prediction.daysUntilMaintenance * 24 * 60 * 60 * 1000));
      await asset.save();
    }

    res.status(201).json({ message: 'Sensor reading added successfully' });
  } catch (err) {
    console.error('Error adding sensor reading:', err);
    res.status(500).json({ error: 'Failed to add sensor reading' });
  }
};

/**
 * POST /assets/:id/maintenance
 * Add a maintenance record to an asset
 */
export const addMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenanceData = req.body;

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await asset.addMaintenanceRecord(maintenanceData);

    // Reset maintenance risk after maintenance
    asset.maintenanceRisk = 0;
    await asset.save();

    res.status(201).json({ message: 'Maintenance record added successfully' });
  } catch (err) {
    console.error('Error adding maintenance record:', err);
    res.status(500).json({ error: 'Failed to add maintenance record' });
  }
};

/**
 * POST /assets/:id/location
 * Update an asset's location
 */
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon, altitude } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await asset.updateLocation(lat, lon, altitude);

    res.json({ message: 'Location updated successfully' });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * GET /assets/maintenance-due
 * Get assets due for maintenance
 */
export const getMaintenanceDueAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      $or: [
        { maintenanceRisk: { $gte: 0.7 } },
        { nextScheduledMaintenance: { $lte: new Date() } }
      ]
    })
    .sort({ maintenanceRisk: -1 })
    .populate('assignedTo', 'name username')
    .lean();

    res.json(assets);
  } catch (err) {
    console.error('Error fetching maintenance due assets:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance due assets' });
  }
};