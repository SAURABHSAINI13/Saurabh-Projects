// backend/models/Feedback.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    correctedLabel: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
    processed: {
      type: Boolean,
      default: false, // consumed by retraining pipeline
    },
    receivedAt: {
      type: Date,
      default: Date.now, // when feedback was first ingested
    },
    originalPrediction: {
      label: String,
      confidence: Number,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

// prevent the same user submitting duplicate feedback for one alert
feedbackSchema.index({ alertId: 1, submittedBy: 1 }, { unique: true });

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
export default Feedback;
