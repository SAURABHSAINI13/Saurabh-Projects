/**
 * Role definitions for the application
 */
export const ROLES = {
  FIELD_OFFICER: 'FIELD_OFFICER',
  COMMAND_CENTER: 'COMMAND_CENTER',
  ADMIN: 'ADMIN',
};

/**
 * Role-based route mapping
 * Maps roles to their respective home routes
 */
export const ROLE_ROUTES = {
  [ROLES.FIELD_OFFICER]: '/officer',
  [ROLES.COMMAND_CENTER]: '/commander',
  [ROLES.ADMIN]: '/admin',
};

/**
 * Get the default route for a user based on their roles
 * @param {Array} roles - Array of user roles
 * @returns {string} The default route for the user
 */
export function getDefaultRouteForRoles(roles = []) {
  if (!roles || !roles.length) return '/login';
  
  // Check for admin role first
  if (roles.includes(ROLES.ADMIN)) {
    return ROLE_ROUTES[ROLES.ADMIN];
  }
  
  // Then check for command center role
  if (roles.includes(ROLES.COMMAND_CENTER)) {
    return ROLE_ROUTES[ROLES.COMMAND_CENTER];
  }
  
  // Default to field officer
  if (roles.includes(ROLES.FIELD_OFFICER)) {
    return ROLE_ROUTES[ROLES.FIELD_OFFICER];
  }
  
  // If no matching role, redirect to login
  return '/login';
}

/**
 * Check if a user has access to a specific route based on their roles
 * @param {Array} roles - Array of user roles
 * @param {string} route - The route to check
 * @returns {boolean} True if user has access, false otherwise
 */
export function hasRouteAccess(roles = [], route) {
  if (!roles || !roles.length) return false;
  
  // Admin has access to all routes
  if (roles.includes(ROLES.ADMIN)) return true;
  
  // Check route prefix against role routes
  const routePrefix = `/${route.split('/')[1]}`;
  
  if (routePrefix === '/officer' && roles.includes(ROLES.FIELD_OFFICER)) {
    return true;
  }
  
  if (routePrefix === '/commander' && roles.includes(ROLES.COMMAND_CENTER)) {
    return true;
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  if (publicRoutes.includes(routePrefix)) {
    return true;
  }
  
  return false;
}