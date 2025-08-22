// backend/middleware/auth.js
import { tokenManager } from '../utils/jwt.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate request by verifying JWT in Authorization header.
 * Expected header: "Bearer <token>"
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('No token provided in Authorization header');
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = tokenManager.verifyAccessToken(token);
    } catch (error) {
      logger.warn('Token verification failed', { error: error.message });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn('User not found for token', { userId: decoded.userId });
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.active) {
      logger.warn('Inactive user attempted to access protected route', { userId: user._id });
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Attach user to request object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', { userId: user._id, path: req.path });

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message, path: req.path });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Authorize based on roles. 
 * Usage: authorizeRoles('FIELD_OFFICER', 'COMMAND_CENTER', 'ADMIN')
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.roles)) {
    logger.warn('Authorization attempted without valid user roles');
    return res.status(403).json({ error: 'Forbidden: no roles present' });
  }
  
  const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    logger.warn('Unauthorized access attempt', { 
      userId: req.user.id, 
      userRoles: req.user.roles, 
      requiredRoles: allowedRoles,
      path: req.path
    });
    
    return res.status(403).json({ 
      error: 'Forbidden: insufficient privileges',
      requiredRoles: allowedRoles,
      userRoles: req.user.roles
    });
  }
  
  logger.debug('User authorized successfully', { 
    userId: req.user.id, 
    roles: req.user.roles,
    path: req.path 
  });
  
  next();
};

export { authenticate, authorizeRoles, refreshToken };

/**
 * Refresh token middleware
 * Validates refresh token and issues a new access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      logger.warn('Refresh token missing in request');
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = tokenManager.verifyRefreshToken(refresh_token);
    } catch (error) {
      logger.warn('Invalid refresh token', { error: error.message });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find the user associated with the token
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn('User not found for refresh token', { userId: decoded.userId });
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.active) {
      logger.warn('Inactive user attempted to refresh token', { userId: user._id });
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = tokenManager.generateTokens(user);

    // Log the successful token refresh
    logger.info('Token refreshed successfully', { userId: user._id });

    // Return the new tokens
    return res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    logger.error('Error in refresh token middleware', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
