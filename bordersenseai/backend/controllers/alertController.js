// backend/controllers/alertController.js
import Alert from '../models/Alert.js';

/** Helper: emit socket event if socket.io is registered */
const emitIO = (app, event, payload) => {
  const io = app.get('io');
  if (io) io.emit(event, payload);
};

/** Allowed enums (could be moved to a shared constants file) */
const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ALLOWED_STATUSES = ['New', 'Acknowledged', 'Dismissed', 'Resolved'];

/**
 * GET /alerts
 * Query alerts with optional filters: severity, status, assignedTo.
 * Supports pagination via ?page=&perPage= (with sensible caps).
 */
export const listAlerts = async (req, res) => {
  try {
    const { severity, status, assignedTo, page = 1, perPage = 50 } = req.query;

    // sanitize / cap pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPageNum = Math.min(200, Math.max(1, parseInt(perPage, 10) || 50)); // cap at 200

    const filter = {};
    if (severity) {
      if (!ALLOWED_SEVERITIES.includes(severity.toLowerCase())) {
        return res.status(400).json({ error: `Invalid severity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}` });
      }
      filter.severity = severity;
    }
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
      }
      filter.status = status;
    }
    if (assignedTo) filter.assignedTo = assignedTo;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * perPageNum)
        .limit(perPageNum)
        .lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({
      meta: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
      },
      data: alerts,
    });
  } catch (err) {
    console.error('listAlerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * POST /alerts/:id/acknowledge
 * Body: { action: 'acknowledge'|'dismiss', comment?: string }
 */
export const acknowledgeAlert = async (req, res) => {
  try {
    const { action, comment } = req.body;
    const { id } = req.params;

    if (!['acknowledge', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'acknowledge' or 'dismiss'" });
    }

    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    alert.status = action === 'acknowledge' ? 'Acknowledged' : 'Dismissed';

    if (comment) {
      if (!Array.isArray(alert.comments)) alert.comments = [];
      alert.comments.push({
        text: comment,
        by: req.user?.id || 'system',
        timestamp: new Date(),
      });
    }

    const saved = await alert.save();

    emitIO(req.app, 'alert-updated', saved);

    res.json(saved);
  } catch (err) {
    console.error('acknowledgeAlert error:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

/**
 * POST /alerts
 * Body: { type, severity, source?, confidence?, geo }
 */
export const createAlert = async (req, res) => {
  try {
    const { type, severity, source, confidence, geo } = req.body;

    if (!type || !severity || !geo) {
      return res.status(400).json({ error: 'type, severity, and geo required' });
    }

    if (!ALLOWED_SEVERITIES.includes(severity.toLowerCase())) {
      return res.status(400).json({ error: `Invalid severity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}` });
    }

    const alert = new Alert({
      type,
      severity,
      source: source || 'Unknown',
      confidence: confidence != null ? confidence : 1.0,
      geo,
      status: 'New',
      timestamp: new Date(),
    });

    const saved = await alert.save();

    emitIO(req.app, 'new-alert', saved);

    res.status(201).json(saved);
  } catch (err) {
    console.error('createAlert error:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};
