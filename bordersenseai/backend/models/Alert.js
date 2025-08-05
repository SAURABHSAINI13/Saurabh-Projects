import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: String,
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  source: String,
  confidence: Number,
  geo: {
    lat: Number,
    lon: Number,
  },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['New', 'Acknowledged', 'Dismissed'], default: 'New' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comments: String,
  // AI model tracking
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIModel' },
  modelName: String,
  modelVersion: String,
  detectionData: {
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    features: [String],
    alternativePredictions: [{
      label: String,
      confidence: Number
    }]
  },
  imageUrl: String,
  location: {
    name: String,
    region: String,
    coordinates: {
      lat: Number,
      lon: Number
    }
  },
  hasFeedback: { type: Boolean, default: false }
}, { timestamps: true });

// Index for faster queries
alertSchema.index({ timestamp: -1 });
alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ modelId: 1 });
alertSchema.index({ 'location.region': 1 });
alertSchema.index({ hasFeedback: 1 });

export default mongoose.model('Alert', alertSchema);
