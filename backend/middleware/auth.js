const jwt = require('jsonwebtoken');

// Verifies the Bearer JWT on the request and attaches the decoded payload
// (_id, email, role) to req.user for downstream handlers
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Gate for admin-only routes — must run after authenticate() since it reads req.user
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Best-effort admin check for routes that stay public but return more to an
// admin caller — a missing or invalid token just means "not admin", not a 401
const isAdminRequest = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try {
    return jwt.verify(token, process.env.JWT_SECRET)?.role === 'admin';
  } catch (error) {
    return false;
  }
};

module.exports = { authenticate, adminOnly, isAdminRequest };