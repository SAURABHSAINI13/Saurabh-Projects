// backend/routes/users.js
import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ====== User Schema ======
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // Should be hashed in production
  role: { type: String, required: true },
  notifications: { type: Boolean, default: true },
});

const User = mongoose.model('User', userSchema);

// ====== GET my profile ======
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /api/users/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ====== UPDATE my profile ======
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { username, email, notifications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, notifications },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('PATCH /api/users/me error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ====== LIST all users (restricted) ======
router.get(
  '/',
  authenticate,
  authorizeRoles('PatrolCommander', 'CentralPlanner', 'DirectorGeneral'),
  async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (err) {
      console.error('GET /api/users error:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

export default router;
