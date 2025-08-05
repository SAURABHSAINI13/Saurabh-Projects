// backend/services/retrainingWorker.js
import Feedback from '../models/Feedback.js';
import Alert from '../models/Alert.js';
import AIModel from '../models/AIModel.js'; // if exists
// Placeholder for retraining logic

export const processFeedbackBatch = async () => {
  const pending = await Feedback.find({ processed: false }).limit(10);
  if (pending.length === 0) return;

  for (const fb of pending) {
    console.log('Processing feedback', fb._id.toString());

    fb.processed = true;
    await fb.save();
  }
};
