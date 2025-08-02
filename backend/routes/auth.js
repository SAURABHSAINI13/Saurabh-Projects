import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user._id, roles: user.roles, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ access_token: token });
});

// (Optional) register endpoint for admin
router.post('/register', async (req, res) => {
  const { name, username, password, roles } = req.body;
  try {
    const user = new User({ name, username, password, roles });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'Registration failed', details: e.message });
  }
});

export default router;
