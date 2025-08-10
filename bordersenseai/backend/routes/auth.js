// backend/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
// import bcrypt from 'bcrypt'; // Uncomment for production password hashing

const router = express.Router();
const User = mongoose.model('User');

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user /* || !(await bcrypt.compare(password, user.password)) */ || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// REGISTER (dev/testing only)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check duplicate
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password, // hashedPassword in production
      role: role || 'officer',
      notifications: true
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;