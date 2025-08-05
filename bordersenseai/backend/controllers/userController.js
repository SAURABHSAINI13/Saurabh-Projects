// backend/controllers/userController.js
import User from '../models/User.js';

export const listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.roles = role;
    if (search) filter.username = { $regex: search, $options: 'i' };
    const users = await User.find(filter).select('-password').limit(200);
    res.json(users);
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
