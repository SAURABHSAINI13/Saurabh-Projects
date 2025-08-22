import { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from '../api/auth.js';
import { secureStore, secureRetrieve } from '../utils/security.js';
import { logSecurityEvent, LOG_LEVELS, SECURITY_EVENTS } from '../utils/securityLogger';

export const AuthContext = createContext(null);

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// Token expiration time in milliseconds (15 minutes)
const TOKEN_EXPIRATION = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from secure storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Retrieve user data from secure storage
        const userData = await secureRetrieve(USER_DATA_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        // Only set user as authenticated if we have both user data and tokens
        if (userData && accessToken && refreshTokenValue) {
          setUser(userData);
          
          // Check token expiration
          const tokenTimestamp = localStorage.getItem('token_timestamp');
          if (tokenTimestamp) {
            const expirationTime = parseInt(tokenTimestamp) + TOKEN_EXPIRATION;
            if (Date.now() > expirationTime) {
              // Token is expired, try to refresh
              try {
                await refreshToken();
              } catch (refreshErr) {
                // If refresh fails, log the user out
                await logout();
              }
            }
          } else {
            // If no timestamp exists but we have tokens, set it now
            localStorage.setItem('token_timestamp', Date.now().toString());
          }
        } else {
          // If we're missing any auth data, clear everything to be safe
          await logout();
        }
      } catch (err) {
        console.error('Error initializing auth state:', err);
        // Clear potentially corrupted data
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('token_timestamp');
        await secureStore(USER_DATA_KEY, null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const { access_token, refresh_token, user: userData } = await apiLogin(username, password);

      // Store tokens and user data securely
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      localStorage.setItem('token_timestamp', Date.now().toString());
      await secureStore(USER_DATA_KEY, userData);

      setUser(userData);
      
      // Log successful authentication
      logSecurityEvent(
        SECURITY_EVENTS.AUTH_SUCCESS,
        LOG_LEVELS.INFO,
        'User successfully authenticated',
        { username: userData.username, roles: userData.roles }
      );
      
      return userData;
    } catch (err) {
      setError(err.message);
      
      // Log failed authentication attempt
      logSecurityEvent(
        SECURITY_EVENTS.AUTH_FAILURE,
        LOG_LEVELS.WARNING,
        'Authentication failed',
        { username, error: err.message || 'Unknown error' }
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Get username before logout for logging
      const username = user?.username || 'unknown';
      
      // Call logout endpoint if user is logged in
      if (user) {
        await apiLogout().catch(() => {
          // Ignore errors from logout endpoint
        });
      }
      
      // Log logout event
      logSecurityEvent(
        SECURITY_EVENTS.LOGOUT,
        LOG_LEVELS.INFO,
        'User logged out',
        { username }
      );
    } catch (error) {
      // Log logout error
      logSecurityEvent(
        SECURITY_EVENTS.LOGOUT,
        LOG_LEVELS.ERROR,
        'Error during logout',
        { error: error.message || 'Unknown error', userId: user?.id }
      );
    } finally {
      // Clear storage and state regardless of API call success
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('token_timestamp');
      localStorage.removeItem('csrf_token');
      await secureStore(USER_DATA_KEY, null);
      setUser(null);
    }
  }, [user]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const { access_token } = await apiRefreshToken(refreshTokenValue);
      if (!access_token) {
        throw new Error('Invalid token response');
      }
      
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem('token_timestamp', Date.now().toString());
      
      // Log token refresh
      logSecurityEvent(
        SECURITY_EVENTS.TOKEN_REFRESH,
        LOG_LEVELS.INFO,
        'Access token refreshed successfully',
        { userId: user?.id }
      );
      
      return access_token;
    } catch (err) {
      // Log token refresh failure
      logSecurityEvent(
        SECURITY_EVENTS.TOKEN_REFRESH,
        LOG_LEVELS.ERROR,
        'Token refresh failed',
        { error: err.message || 'Unknown error', userId: user?.id }
      );
      
      // Clear tokens but don't call logout() to avoid circular dependency
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('token_timestamp');
      await secureStore(USER_DATA_KEY, null);
      setUser(null);
      
      throw err;
    }
  }, [user]);

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    if (!user?.roles || !roles.length) return false;
    return roles.some(role => user.roles.includes(role));
  }, [user]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};