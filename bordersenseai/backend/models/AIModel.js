// backend/models/AIModel.js
import mongoose from 'mongoose';

// Schema for model performance metrics
const performanceMetricsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  accuracy: Number,
  precision: Number,
  recall: Number,
  f1Score: Number,
  falsePositiveRate: Number,
  falseNegativeRate: Number,
  latency: Number, // in milliseconds
  customMetrics: mongoose.Schema.Types.Mixed
});

// Schema for model version history
const versionHistorySchema = new mongoose.Schema({
  version: String,
  deployedAt: { type: Date, default: Date.now },
  trainedAt: Date,
  trainingDataset: String,
  validationScore: Number,
  parameters: mongoose.Schema.Types.Mixed,
  notes: String,
  deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Main AIModel schema
const aiModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['object-detection', 'anomaly-detection', 'predictive-maintenance', 
           'route-optimization', 'threat-assessment', 'image-classification', 'other']
  },
  description: String,
  currentVersion: String,
  status: { 
    type: String, 
    enum: ['Active', 'Training', 'Testing', 'Deprecated', 'Failed'],
    default: 'Active'
  },
  deploymentRegions: [String],
  targetAssetTypes: [String],
  confidenceThreshold: { type: Number, min: 0, max: 1, default: 0.7 },
  performanceMetrics: [performanceMetricsSchema],
  versionHistory: [versionHistorySchema],
  lastRetrainedAt: Date,
  retrainingSchedule: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'manual'] },
    lastScheduledAt: Date,
    nextScheduledAt: Date
  },
  feedbackCount: { type: Number, default: 0 },
  falsePositiveCount: { type: Number, default: 0 },
  falseNegativeCount: { type: Number, default: 0 },
  modelPath: String, // Path to model files in storage
  apiEndpoint: String, // For models exposed via API
  tags: [String],
  notes: String
}, { timestamps: true });

// Index for efficient queries
aiModelSchema.index({ type: 1, status: 1 });
aiModelSchema.index({ deploymentRegions: 1 });
aiModelSchema.index({ targetAssetTypes: 1 });

// Virtual for days since last retraining
aiModelSchema.virtual('daysSinceRetraining').get(function() {
  if (!this.lastRetrainedAt) return null;
  const diffTime = Math.abs(new Date() - this.lastRetrainedAt);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Days
});

// Method to add performance metrics
aiModelSchema.methods.addPerformanceMetrics = function(metrics) {
  this.performanceMetrics.push(metrics);
  
  // Keep only the last 100 metrics to prevent document size issues
  if (this.performanceMetrics.length > 100) {
    this.performanceMetrics = this.performanceMetrics.slice(-100);
  }
  
  return this.save();
};

// Method to add new version
aiModelSchema.methods.addVersion = function(version) {
  this.versionHistory.push(version);
  this.currentVersion = version.version;
  this.lastRetrainedAt = version.trainedAt || new Date();
  
  return this.save();
};

// Method to record feedback
aiModelSchema.methods.recordFeedback = function(isFalsePositive, isFalseNegative) {
  this.feedbackCount += 1;
  
  if (isFalsePositive) {
    this.falsePositiveCount += 1;
  }
  
  if (isFalseNegative) {
    this.falseNegativeCount += 1;
  }
  
  return this.save();
};

// Method to check if retraining is needed based on feedback
aiModelSchema.methods.needsRetraining = function(threshold = 100) {
  // If feedback count exceeds threshold and error rate is high
  if (this.feedbackCount >= threshold) {
    const errorRate = (this.falsePositiveCount + this.falseNegativeCount) / this.feedbackCount;
    return errorRate > 0.1; // 10% error rate threshold
  }
  
  return false;
};

export default mongoose.model('AIModel', aiModelSchema);