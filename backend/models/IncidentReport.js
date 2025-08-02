import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  description: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('IncidentReport', incidentReportSchema);
