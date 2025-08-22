// backend/utils/jwt.js
import jwt from 'jsonwebtoken';

/**
 * JWT token management for authentication
 * Implements access and refresh token pattern
 */
export const tokenManager = {
  /**
   * Generate an access token
   * @param {Object} payload - User data to include in token
   * @returns {string} - JWT access token
   */
  generateAccessToken: (payload) => {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } // Short-lived token
    );
  },

  /**
   * Generate a refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} - JWT refresh token
   */
  generateRefreshToken: (payload) => {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Longer-lived token
    );
  },

  /**
   * Verify an access token
   * @param {string} token - JWT access token to verify
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  verifyAccessToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      return null;
    }
  },

  /**
   * Verify a refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  verifyRefreshToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  },

  /**
   * Extract token from authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} - Extracted token or null if invalid
   */
  extractTokenFromHeader: (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
};