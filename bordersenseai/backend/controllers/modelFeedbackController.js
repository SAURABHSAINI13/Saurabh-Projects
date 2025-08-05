// backend/controllers/modelFeedbackController.js
import Feedback from '../models/Feedback.js';
import Alert from '../models/Alert.js';
import { recordFeedback } from '../services/modelFeedbackService.js';

/**
 * Submit feedback for an AI model detection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitFeedback = async (req, res) => {
  try {
    const { alertId, correctedLabel, comments, originalPrediction } = req.body;
    
    // Validate required fields
    if (!alertId || !correctedLabel) {
      return res.status(400).json({ error: 'alertId and correctedLabel are required' });
    }
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Prevent duplicate feedback from same user for same alert
    const existing = await Feedback.findOne({
      alertId,
      submittedBy: req.user.id,
    });

    if (existing) {
      return res.status(409).json({ error: 'Feedback for this alert by you already exists' });
    }

    // Record feedback using the service
    const feedback = await recordFeedback({
      alertId,
      submittedBy: req.user.id,
      correctedLabel,
      comments,
      originalPrediction: originalPrediction || {
        label: alert.type,
        confidence: alert.confidence
      }
    });

    res.status(201).json({
      message: 'Feedback recorded',
      feedbackId: feedback._id,
    });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

/**
 * Get feedback for a specific alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAlertFeedback = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const feedback = await Feedback.find({ alertId })
      .populate('submittedBy', 'username name')
      .sort({ receivedAt: -1 })
      .exec();
    
    res.status(200).json(feedback);
  } catch (err) {
    console.error('getAlertFeedback error:', err);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
};

/**
 * Get all feedback submitted by the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserFeedback = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const feedback = await Feedback.find({ submittedBy: req.user.id })
      .populate('alertId')
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    const total = await Feedback.countDocuments({ submittedBy: req.user.id });
    
    res.status(200).json({
      feedback,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('getUserFeedback error:', err);
    res.status(500).json({ error: 'Failed to get user feedback' });
  }
};

/**
 * Get feedback statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFeedbackStats = async (req, res) => {
  try {
    // Get total feedback count
    const totalFeedback = await Feedback.countDocuments();
    
    // Get feedback counts by corrected label
    const labelCounts = await Feedback.aggregate([
      { $group: { _id: '$correctedLabel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get feedback counts by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyCounts = await Feedback.aggregate([
      { $match: { receivedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get processed vs unprocessed counts
    const processedCount = await Feedback.countDocuments({ processed: true });
    const unprocessedCount = await Feedback.countDocuments({ processed: false });
    
    res.status(200).json({
      totalFeedback,
      labelCounts,
      dailyCounts,
      processedStats: {
        processed: processedCount,
        unprocessed: unprocessedCount,
        processingRate: totalFeedback > 0 ? processedCount / totalFeedback : 0
      }
    });
  } catch (err) {
    console.error('getFeedbackStats error:', err);
    res.status(500).json({ error: 'Failed to get feedback statistics' });
  }
};