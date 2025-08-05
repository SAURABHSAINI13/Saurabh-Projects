// backend/controllers/reportController.js
import IncidentReport from '../models/IncidentReport.js';
import Alert from '../models/Alert.js';

export const createReport = async (req, res) => {
  try {
    const { alertId, description, confirmedBy } = req.body;
    if (!alertId || !description || !confirmedBy) {
      return res.status(400).json({ error: 'alertId, description, confirmedBy required' });
    }

    const alert = await Alert.findById(alertId);
    if (alert) {
      alert.status = 'Acknowledged';
      await alert.save();
    }

    const report = new IncidentReport({
      alertId,
      description,
      confirmedBy,
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error('createReport error', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
};
