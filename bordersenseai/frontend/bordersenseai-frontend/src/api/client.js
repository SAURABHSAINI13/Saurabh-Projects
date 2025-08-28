// src/api/client.js
import { getAccessToken, getRefreshToken } from '../utils/auth';
import { addCSRFToken, generateCSRFToken } from '../utils/security';
import { sanitizeInput } from '../utils/validation';
import { recordAttempt, generateRateLimitKey } from '../utils/rateLimit';
import { logSecurityEvent, LOG_LEVELS, SECURITY_EVENTS, monitorSuspiciousActivity } from '../utils/securityLogger';
 import { getRateLimit } from '../utils/rateLimit';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generate CSRF token on module load
if (!localStorage.getItem('csrf_token')) {
  generateCSRFToken();
}

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of requests waiting for token refresh
let refreshQueue = [];

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} The new access token
 */
async function refreshAccessToken() {
  if (isRefreshing) {
    // Return a promise that resolves when the refresh is complete
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    isRefreshing = false;
    // Clear any queued requests
    refreshQueue.forEach(({ reject }) => 
      reject(new Error('No refresh token available'))
    );
    refreshQueue = [];
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include', // Include cookies for CSRF protection
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to refresh token');
    }

    const data = await response.json();
    
    // Validate the response contains an access token
    if (!data.access_token) {
      throw new Error('Invalid token response');
    }
    
    // Store the new token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('token_timestamp', Date.now().toString());

    // Resolve all queued requests
    refreshQueue.forEach(({ resolve }) => resolve(data.access_token));
    refreshQueue = [];

    isRefreshing = false;
    return data.access_token;
  } catch (error) {
    // Reject all queued requests
    refreshQueue.forEach(({ reject }) => reject(error));
    refreshQueue = [];

    // Clear tokens on refresh failure
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_timestamp');
    
    // Log the error
    console.error('Token refresh failed:', error);
    
    isRefreshing = false;
    throw error;
  }
}

/**
 * Generic request wrapper with token refresh capability.
 * If you pass `body` as an object, it will be JSON-stringified here.
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @param {boolean} retry - Whether this is a retry after token refresh
 * @returns {Promise<Object>} API response
 */
export const request = async (path, options = {}, retry = false) => {
  // Check for rate limiting on sensitive endpoints
  const sensitiveEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/users/profile'
  ];
  
  // Apply rate limiting for sensitive endpoints
  if (sensitiveEndpoints.some(e => path.includes(e))) {
    // Generate a rate limit key based on the endpoint
    // In a real app, you would include IP address which would be provided by the backend
    const rateLimitKey = generateRateLimitKey(path, 'client');
    const rateLimitStatus = recordAttempt(rateLimitKey, {
      // More strict rate limiting for auth endpoints
      maxAttempts: path.includes('/auth/') ? 5 : 20,
      windowMs: 60 * 1000, // 1 minute window
      incrementOnCheck: true
    });
    
    if (rateLimitStatus.blocked) {
      throw new Error(rateLimitStatus.message || 'Too many requests. Please try again later.');
    }
  }

  const token = getAccessToken();

  // Add security headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  // Add CSRF token to non-GET requests
  if (options.method && options.method !== 'GET') {
    Object.assign(headers, addCSRFToken(headers));
  }

  // If caller provided a plain object body, sanitize and stringify it.
  let body = options.body;
  
  if (body && typeof body === 'object') {
    // Sanitize string values in the body object to prevent XSS
    const sanitizedBody = Object.entries(body).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
      return acc;
    }, {});
    
    body = JSON.stringify(sanitizedBody);
  }

  // Check for suspicious activity in request data
  if (body) {
    monitorSuspiciousActivity({
      type: 'api_request',
      input: typeof body === 'string' ? body : JSON.stringify(body),
      url: `${API_BASE}${path}`,
      method: options.method || 'GET'
    });
  }
  
  // Log API request (excluding sensitive endpoints)
  const isSensitiveEndpoint = path.includes('/auth/login') || path.includes('/auth/register');
  if (!isSensitiveEndpoint) {
    logSecurityEvent(
      SECURITY_EVENTS.INFO,
      LOG_LEVELS.INFO,
      `API Request: ${options.method || 'GET'} ${path}`,
      { method: options.method || 'GET', path }
    );
  }
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body,
    });

    let payload = {};
    try {
      const text = await res.text();
      // Only parse as JSON if the content is not empty
      payload = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      // ignore parse errors; payload stays {}
    }

    // Handle token expiration
    if (res.status === 401 && !retry) {
      try {
        // Log unauthorized access attempt
        logSecurityEvent(
          SECURITY_EVENTS.AUTH_FAILURE,
          LOG_LEVELS.WARNING,
          'Unauthorized API access attempt - trying token refresh',
          { path, method: options.method || 'GET' }
        );
        
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        
        // Retry the request with the new token
        return request(
          path,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          },
          true // Mark as a retry to prevent infinite loops
        );
      } catch (refreshError) {
        // Log session expiration
        logSecurityEvent(
          SECURITY_EVENTS.AUTH_FAILURE,
          LOG_LEVELS.WARNING,
          'Session expired - redirecting to login',
          { path, error: refreshError.message }
        );
        
        // If refresh fails, redirect to login
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Log 403 Forbidden errors (permission issues)
    if (res.status === 403) {
      logSecurityEvent(
        SECURITY_EVENTS.PERMISSION_DENIED,
        LOG_LEVELS.WARNING,
        'Permission denied for API request',
        { path, method: options.method || 'GET' }
      );
    }

    if (!res.ok) {
      throw new Error(payload.error || `HTTP ${res.status}`);
    }

    return payload;
  } catch (error) {
    // Log network errors
    logSecurityEvent(
      SECURITY_EVENTS.ERROR,
      LOG_LEVELS.ERROR,
      'API request network error',
      { path, error: error.message, method: options.method || 'GET' }
    );
    
    // Handle network errors
    if (!retry && error.message === 'Failed to fetch') {
      console.error('Network error:', error);
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};