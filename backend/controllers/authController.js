const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Fixed dummy hash so the no-such-user branch still pays the bcrypt cost
// below — otherwise that branch returns far faster than a wrong-password
// branch, letting an attacker enumerate valid emails via response timing.
const DUMMY_HASH = '$2a$10$2a/Ukh3/tpJBs28ZtBYF4eP9TFbdVb/5xjvR709fTj68eyTVQCjiO';

// Admin login only — there's no public registration endpoint, admin accounts
// are created directly in the database. Verifies email/password, checks the
// role is admin, and issues a 7-day JWT.
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' ||
        email.trim().length === 0 || password.trim().length === 0) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalisedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalisedEmail });
    if (!user) {
      // Same generic error as a wrong password below, so the response
      // doesn't reveal whether the email exists
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { _id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { login };
