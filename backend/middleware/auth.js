import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth header' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorizeRoles = (...allowed) => (req, res, next) => {
  const { roles } = req.user;
  if (!roles || !roles.some(r => allowed.includes(r))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
