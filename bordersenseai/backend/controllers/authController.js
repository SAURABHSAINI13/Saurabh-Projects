import User from '../models/User.js';
import { tokenManager } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info({ msg: 'Login attempt', username });

    const user = await User.findOne({ username, active: true });
    if (!user) {
      logger.warn({ msg: 'Login failed - user not found or inactive', username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      logger.warn({ msg: 'Login failed - password mismatch', username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Create payload for tokens
    const tokenPayload = { 
      id: user._id, 
      username: user.username, 
      roles: user.roles 
    };

    // Generate tokens
    const accessToken = tokenManager.generateAccessToken(tokenPayload);
    const refreshToken = tokenManager.generateRefreshToken(tokenPayload);

    logger.info({ msg: 'Login successful', username, roles: user.roles });
    
    // Return both tokens
    res.json({ 
      access_token: accessToken, 
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        roles: user.roles
      }
    });
  } catch (e) {
    console.error('Login error', e);
    res.status(500).json({ error: 'Server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, username, email, password, roles } = req.body;
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Registration failed', 
        details: 'Username or email already exists' 
      });
    }
    
    // Create new user
    const user = new User({ name, username, email, password, roles });
    await user.save();
    
    logger.info({ msg: 'User registered', username, roles });
    res.status(201).json({ message: 'User created successfully' });
  } catch (e) {
    logger.error({ msg: 'Registration error', error: e.message });
    res.status(400).json({ error: 'Registration failed', details: e.message });
  }
};

/**
 * Logout a user by invalidating their refresh token
 * In a production system, this would add the token to a blacklist or revoke it
 */
export const logout = (req, res) => {
  // In a real implementation, you would add the token to a blacklist
  // or use a token repository to track and invalidate tokens
  
  // For now, we'll just return a success message
  // The client should remove the tokens from storage
  res.json({ message: 'Logout successful' });
};

/**
 * Get the current user's profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (e) {
    logger.error({ msg: 'Get profile error', error: e.message, userId: req.user.id });
    res.status(500).json({ error: 'Server error' });
  }
};
