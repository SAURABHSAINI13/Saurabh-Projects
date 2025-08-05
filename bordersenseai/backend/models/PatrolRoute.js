import mongoose from 'mongoose';

const waypointSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  eta: Date,
});

// Schema for AI model information used in route optimization
const aiModelSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIModel' },
  modelName: String,
  modelVersion: String,
  confidenceThreshold: Number
}, { _id: false });

const patrolRouteSchema = new mongoose.Schema({
  waypoints: [waypointSchema],
  optimizationScore: Number,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regionId: String,
  aiModelUsed: aiModelSchema, // AI model used for route optimization
}, { timestamps: true });

export default mongoose.model('PatrolRoute', patrolRouteSchema);