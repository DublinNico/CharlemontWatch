const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Public: Register a new resident
router.post('/register', register);

// Public: Login
router.post('/login', login);

module.exports = router;