// backend/controllers/aiModelController.js
import AIModel from '../models/AIModel.js';

/**
 * GET /ai-models
 * List AI models with optional filtering and pagination
 */
export const listModels = async (req, res) => {
  try {
    const { 
      type, status, region, targetAssetType,
      page = 1, perPage = 20, 
      sort = 'name', order = 'asc' 
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.deploymentRegions = region; // Array field
    if (targetAssetType) filter.targetAssetTypes = targetAssetType; // Array field

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page, 10));
    const perPageNum = Math.min(100, Math.max(1, parseInt(perPage, 10)));

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [models, total] = await Promise.all([
      AIModel.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .lean(),
      AIModel.countDocuments(filter)
    ]);

    res.json({
      meta: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
      },
      data: models,
    });
  } catch (err) {
    console.error('Error listing AI models:', err);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
};

/**
 * GET /ai-models/:id
 * Get a single AI model by ID
 */
export const getModel = async (req, res) => {
  try {
    const model = await AIModel.findById(req.params.id).lean();

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json(model);
  } catch (err) {
    console.error('Error fetching AI model:', err);
    res.status(500).json({ error: 'Failed to fetch AI model' });
  }
};

/**
 * POST /ai-models
 * Create a new AI model
 */
export const createModel = async (req, res) => {
  try {
    const modelData = req.body;

    // Validate required fields
    if (!modelData.name || !modelData.type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Set default values if not provided
    if (!modelData.status) modelData.status = 'Development';
    if (!modelData.confidenceThreshold) modelData.confidenceThreshold = 0.7;
    
    // Initialize version history if not provided
    if (!modelData.versionHistory || !modelData.versionHistory.length) {
      modelData.versionHistory = [{
        version: '1.0.0',
        deployedAt: new Date(),
        changes: 'Initial model deployment'
      }];
    }

    const model = new AIModel(modelData);
    const savedModel = await model.save();

    res.status(201).json(savedModel);
  } catch (err) {
    console.error('Error creating AI model:', err);
    res.status(500).json({ error: 'Failed to create AI model' });
  }
};

/**
 * PUT /ai-models/:id
 * Update an existing AI model
 */
export const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find and update the model
    const model = await AIModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json(model);
  } catch (err) {
    console.error('Error updating AI model:', err);
    res.status(500).json({ error: 'Failed to update AI model' });
  }
};

/**
 * DELETE /ai-models/:id
 * Delete an AI model
 */
export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await AIModel.findByIdAndDelete(id);

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json({ message: 'AI model deleted successfully' });
  } catch (err) {
    console.error('Error deleting AI model:', err);
    res.status(500).json({ error: 'Failed to delete AI model' });
  }
};

/**
 * POST /ai-models/:id/metrics
 * Add performance metrics to an AI model
 */
export const addMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const metricsData = req.body;

    // Validate required fields
    if (!metricsData.accuracy || !metricsData.precision || !metricsData.recall) {
      return res.status(400).json({ 
        error: 'Accuracy, precision, and recall metrics are required' 
      });
    }

    const model = await AIModel.findById(id);

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    // Add metrics
    await model.addMetrics(metricsData);

    res.status(201).json({ 
      message: 'Performance metrics added successfully',
      needsRetraining: model.needsRetraining()
    });
  } catch (err) {
    console.error('Error adding metrics:', err);
    res.status(500).json({ error: 'Failed to add metrics' });
  }
};

/**
 * POST /ai-models/:id/version
 * Add a new version to an AI model
 */
export const addVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const versionData = req.body;

    // Validate required fields
    if (!versionData.version || !versionData.changes) {
      return res.status(400).json({ 
        error: 'Version number and changes description are required' 
      });
    }

    const model = await AIModel.findById(id);

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    // Add version
    await model.addVersion(versionData);

    res.status(201).json({ message: 'Version added successfully' });
  } catch (err) {
    console.error('Error adding version:', err);
    res.status(500).json({ error: 'Failed to add version' });
  }
};

/**
 * POST /ai-models/:id/feedback
 * Record feedback for an AI model
 */
export const recordFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, detectionId, isCorrect } = req.body;

    // Validate required fields
    if (typeof isCorrect !== 'boolean' || !detectionId) {
      return res.status(400).json({ 
        error: 'Detection ID and correctness flag are required' 
      });
    }

    const model = await AIModel.findById(id);

    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    // Record feedback
    await model.recordFeedback({
      detectionId,
      isCorrect,
      feedback: feedback || '',
      timestamp: new Date()
    });

    res.status(201).json({ 
      message: 'Feedback recorded successfully',
      needsRetraining: model.needsRetraining()
    });
  } catch (err) {
    console.error('Error recording feedback:', err);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
};

/**
 * GET /ai-models/needs-retraining
 * Get models that need retraining
 */
export const getModelsNeedingRetraining = async (req, res) => {
  try {
    // Find all active models
    const models = await AIModel.find({ status: { $ne: 'Deprecated' } }).lean();
    
    // Filter models that need retraining
    const modelsNeedingRetraining = [];
    
    for (const model of models) {
      const modelInstance = new AIModel(model);
      if (modelInstance.needsRetraining()) {
        modelsNeedingRetraining.push(model);
      }
    }

    res.json(modelsNeedingRetraining);
  } catch (err) {
    console.error('Error fetching models needing retraining:', err);
    res.status(500).json({ error: 'Failed to fetch models needing retraining' });
  }
};