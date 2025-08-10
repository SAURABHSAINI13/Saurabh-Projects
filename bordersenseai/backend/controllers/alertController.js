import mongoose from 'mongoose';

const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ALLOWED_STATUSES = ['New', 'Acknowledged', 'Dismissed', 'Resolved'];

const emitIO = (app, event, payload) => {
  const io = app.get('io');
  if (io) io.emit(event, payload);
};

export const listAlerts = async (req, res) => {
  try {
    const { severity, status, assignedTo, page = 1, perPage = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPageNum = Math.min(200, Math.max(1, parseInt(perPage, 10) || 50));

    if (severity && !ALLOWED_SEVERITIES.includes(severity.toLowerCase())) {
      return res.status(400).json({ error: `Invalid severity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}` });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const query = {};
    if (severity) query.severity = severity.toLowerCase();
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const alerts = await mongoose.model('Alert')
      .find(query)
      .skip((pageNum - 1) * perPageNum)
      .limit(perPageNum)
      .sort({ timestamp: -1 });

    const total = await mongoose.model('Alert').countDocuments(query);

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

export const createAlert = async (req, res) => {
  try {
    const { type, severity, geo, location, message, source, confidence } = req.body;

    if (!type || !severity || (!geo && !location)) {
      return res.status(400).json({ error: 'type, severity, and geo/location required' });
    }
    if (!ALLOWED_SEVERITIES.includes(severity.toLowerCase())) {
      return res.status(400).json({ error: `Invalid severity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}` });
    }

    const sanitizedMessage = message ? message.replace(/[<>{}]/g, '') : type;
    const alert = await mongoose.model('Alert').create({
      type,
      message: sanitizedMessage,
      severity: severity.toLowerCase(),
      location: location || geo,
      source: source || 'Unknown',
      confidence: confidence != null ? confidence : 1.0,
      status: 'New',
      timestamp: new Date(),
    });

    emitIO(req.app, 'new_alert', alert);
    res.status(201).json(alert);
  } catch (err) {
    console.error('createAlert error:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

export const acknowledgeAlert = async (req, res) => {
  try {
    const { action, comment } = req.body;
    const { id } = req.params;

    if (!['acknowledge', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'acknowledge' or 'dismiss'" });
    }

    const status = action === 'acknowledge' ? 'Acknowledged' : 'Dismissed';
    const update = { status };
    if (comment) update.comments = [...(await mongoose.model('Alert').findById(id).comments || []), comment];

    const updatedAlert = await mongoose.model('Alert').findByIdAndUpdate(id, update, { new: true });
    if (!updatedAlert) return res.status(404).json({ error: 'Alert not found' });

    emitIO(req.app, 'alert_updated', updatedAlert);
    res.json(updatedAlert);
  } catch (err) {
    console.error('acknowledgeAlert error:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};