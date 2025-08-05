import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Attempt login for:', username);

    const user = await User.findOne({ username });
    console.log('Found user?', !!user);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match?', match);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log('✅ Login success. Token issued.');
    res.json({ access_token: token, expires_in: 7200 });
  } catch (e) {
    console.error('Login error', e);
    res.status(500).json({ error: 'Server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, username, password, roles } = req.body;
    const user = new User({ name, username, password, roles });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (e) {
    console.error('Register error', e);
    res.status(400).json({ error: 'Registration failed', details: e.message });
  }
};
