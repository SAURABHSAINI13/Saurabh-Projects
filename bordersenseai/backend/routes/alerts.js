import express from "express";
import mongoose from "mongoose";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import Alert from "../models/Alert.js";

// Using the imported Alert model instead of redefining it

// ====== Controllers ======
const listAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching alerts", error: error.message });
  }
};

const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    alert.status = "Acknowledged";
    await alert.save();
    res.json({ message: "Alert acknowledged successfully", alert });
  } catch (error) {
    res.status(500).json({ message: "Error acknowledging alert", error: error.message });
  }
};

const createAlert = async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: "Error creating alert", error: error.message });
  }
};

// ====== Router ======
const router = express.Router();
router.get("/", authenticate, listAlerts);
router.post("/:id/acknowledge", authenticate, acknowledgeAlert);
router.post(
  "/create",
  authenticate,
  authorizeRoles("DroneOperator", "IntelligenceAnalyst", "PatrolCommander"),
  createAlert
);

export default router;
