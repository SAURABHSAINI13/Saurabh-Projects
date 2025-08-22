// backend/routes/auth.js
import express from 'express';
import { login, register, logout, getProfile } from '../controllers/authController.js';
import { authenticate, refreshToken } from '../middleware/auth.js';

const router = express.Router();

// Login - Get access and refresh tokens
router.post('/login', login);

// Register new user (restricted in production)
router.post('/register', register);

// Refresh access token using refresh token
router.post('/refresh-token', refreshToken);

// Logout - invalidate refresh token
router.post('/logout', authenticate, logout);

// Get current user profile
router.get('/profile', authenticate, getProfile);

export default router;