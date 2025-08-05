// backend/services/modelFeedbackService.js
import Feedback from '../models/Feedback.js';
import AIModel from '../models/AIModel.js';
import Alert from '../models/Alert.js';

/**
 * Service for handling AI model feedback and retraining
 */

/**
 * Record feedback for an AI model detection
 * @param {Object} feedbackData - The feedback data
 * @param {string} feedbackData.alertId - ID of the alert being corrected
 * @param {string} feedbackData.submittedBy - ID of the user submitting feedback
 * @param {string} feedbackData.correctedLabel - The correct label/classification
 * @param {string} feedbackData.comments - Optional comments about the correction
 * @param {Object} feedbackData.originalPrediction - The original AI prediction
 * @returns {Promise<Object>} - The saved feedback record
 */
export const recordFeedback = async (feedbackData) => {
  try {
    // Validate required fields
    if (!feedbackData.alertId || !feedbackData.submittedBy || !feedbackData.correctedLabel) {
      throw new Error('Missing required feedback fields');
    }

    // Get the alert to determine which model generated it
    const alert = await Alert.findById(feedbackData.alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Create feedback record
    const feedback = new Feedback({
      alertId: feedbackData.alertId,
      submittedBy: feedbackData.submittedBy,
      correctedLabel: feedbackData.correctedLabel,
      comments: feedbackData.comments || '',
      originalPrediction: feedbackData.originalPrediction || {
        label: alert.type,
        confidence: alert.confidence
      },
      processed: false
    });

    // Save the feedback
    const savedFeedback = await feedback.save();

    // Update model statistics if we know which model generated the alert
    if (alert.modelId) {
      await updateModelFeedbackStats(alert.modelId, savedFeedback);
    }

    return savedFeedback;
  } catch (error) {
    console.error('Error recording feedback:', error);
    throw error;
  }
};

/**
 * Update AI model statistics based on feedback
 * @param {string} modelId - ID of the AI model
 * @param {Object} feedback - The feedback record
 * @returns {Promise<void>}
 */
const updateModelFeedbackStats = async (modelId, feedback) => {
  try {
    const model = await AIModel.findById(modelId);
    if (!model) return;

    // Determine if this is a false positive or false negative
    const originalLabel = feedback.originalPrediction?.label;
    const correctedLabel = feedback.correctedLabel;
    
    const isFalsePositive = originalLabel && correctedLabel === 'none';
    const isFalseNegative = originalLabel === 'none' && correctedLabel !== 'none';

    // Update model statistics
    await model.recordFeedback(isFalsePositive, isFalseNegative);

    // Check if retraining is needed
    if (model.needsRetraining()) {
      console.log(`Model ${model.name} needs retraining based on feedback threshold`);
      // This could trigger a notification or automatic retraining process
    }
  } catch (error) {
    console.error('Error updating model feedback stats:', error);
  }
};

/**
 * Get models that need retraining based on feedback
 * @returns {Promise<Array>} - List of models needing retraining
 */
export const getModelsNeedingRetraining = async () => {
  try {
    // Get all active models
    const models = await AIModel.find({ status: { $ne: 'Deprecated' } });
    
    // Filter models that need retraining
    return models.filter(model => model.needsRetraining());
  } catch (error) {
    console.error('Error getting models needing retraining:', error);
    throw error;
  }
};

/**
 * Process a batch of feedback for retraining
 * @param {number} batchSize - Number of feedback items to process
 * @returns {Promise<number>} - Number of processed feedback items
 */
export const processFeedbackBatch = async (batchSize = 50) => {
  try {
    // Get unprocessed feedback
    const feedbackItems = await Feedback.find({ processed: false })
      .limit(batchSize)
      .populate('alertId')
      .exec();

    if (feedbackItems.length === 0) return 0;

    // Group feedback by model
    const feedbackByModel = {};
    
    for (const feedback of feedbackItems) {
      const alert = feedback.alertId;
      if (!alert || !alert.modelId) continue;
      
      if (!feedbackByModel[alert.modelId]) {
        feedbackByModel[alert.modelId] = [];
      }
      
      feedbackByModel[alert.modelId].push(feedback);
    }

    // Process feedback for each model
    for (const [modelId, modelFeedback] of Object.entries(feedbackByModel)) {
      if (modelFeedback.length >= 10) { // Only retrain if we have enough feedback
        await prepareModelRetraining(modelId, modelFeedback);
      }
    }

    // Mark all as processed
    await Feedback.updateMany(
      { _id: { $in: feedbackItems.map(f => f._id) } },
      { processed: true }
    );

    return feedbackItems.length;
  } catch (error) {
    console.error('Error processing feedback batch:', error);
    throw error;
  }
};

/**
 * Prepare a model for retraining based on feedback
 * @param {string} modelId - ID of the model to retrain
 * @param {Array} feedbackItems - Feedback items for this model
 * @returns {Promise<void>}
 */
const prepareModelRetraining = async (modelId, feedbackItems) => {
  try {
    const model = await AIModel.findById(modelId);
    if (!model) return;

    // In a real implementation, this would:
    // 1. Prepare training data based on feedback
    // 2. Trigger model retraining job
    // 3. Update model status to 'Training'
    
    console.log(`Preparing retraining for model ${model.name} with ${feedbackItems.length} feedback items`);
    
    // Update model status
    model.status = 'Training';
    await model.save();
    
    // This would typically call an external ML training service or queue a job
    simulateModelRetraining(model, feedbackItems);
  } catch (error) {
    console.error('Error preparing model retraining:', error);
  }
};

/**
 * Simulate model retraining (in a real system, this would be a separate service)
 * @param {Object} model - The model to retrain
 * @param {Array} feedbackItems - Feedback items for training
 */
const simulateModelRetraining = async (model, feedbackItems) => {
  // Simulate training delay
  setTimeout(async () => {
    try {
      // Generate simulated performance metrics
      const newAccuracy = 0.7 + (Math.random() * 0.25); // 70-95%
      const newPrecision = 0.7 + (Math.random() * 0.25);
      const newRecall = 0.7 + (Math.random() * 0.25);
      
      // Add new version
      const versionParts = model.currentVersion ? model.currentVersion.split('.') : ['0', '0', '0'];
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString(); // Increment patch version
      const newVersion = versionParts.join('.');
      
      // Add performance metrics
      await model.addPerformanceMetrics({
        accuracy: newAccuracy,
        precision: newPrecision,
        recall: newRecall,
        f1Score: 2 * (newPrecision * newRecall) / (newPrecision + newRecall),
        falsePositiveRate: 1 - newPrecision,
        falseNegativeRate: 1 - newRecall,
        latency: 50 + (Math.random() * 100) // 50-150ms
      });
      
      // Add new version
      await model.addVersion({
        version: newVersion,
        trainedAt: new Date(),
        validationScore: newAccuracy,
        notes: `Retrained based on ${feedbackItems.length} feedback items`
      });
      
      // Update model status
      model.status = 'Active';
      model.falsePositiveCount = 0; // Reset counters after retraining
      model.falseNegativeCount = 0;
      model.feedbackCount = 0;
      await model.save();
      
      console.log(`Model ${model.name} retrained successfully to version ${newVersion}`);
    } catch (error) {
      console.error('Error in model retraining simulation:', error);
      // Set model status back to active in case of error
      try {
        model.status = 'Active';
        await model.save();
      } catch (saveError) {
        console.error('Error resetting model status:', saveError);
      }
    }
  }, 5000); // Simulate 5 second training time
};