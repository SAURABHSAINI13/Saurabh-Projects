import mongoose from 'mongoose';

const waypointSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  eta: Date,
});

const patrolRouteSchema = new mongoose.Schema({
  waypoints: [waypointSchema],
  optimizationScore: Number,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regionId: String,
}, { timestamps: true });

export default mongoose.model('PatrolRoute', patrolRouteSchema);