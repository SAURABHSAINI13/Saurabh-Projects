// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Authenticate request by verifying JWT in Authorization header.
 * Expected header: "Bearer <token>"
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed authorization header' });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, roles, name, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Authorize based on roles. Usage: authorizeRoles('PatrolCommander', 'DirectorGeneral')
 */
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.roles)) {
    return res.status(403).json({ error: 'Forbidden: no roles present' });
  }
  const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
  }
  next();
};
