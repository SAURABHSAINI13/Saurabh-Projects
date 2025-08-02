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
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);
