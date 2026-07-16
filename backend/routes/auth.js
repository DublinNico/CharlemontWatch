const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login } = require('../controllers/authController');

// Throttles login attempts per IP to slow down brute-force password guessing
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Admin login
router.post('/login', loginLimiter, login);

module.exports = router;
