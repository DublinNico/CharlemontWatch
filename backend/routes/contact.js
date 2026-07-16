const express = require('express');
const router = express.Router();
const { submitContactMessage } = require('../controllers/contactController');

// Public: Contact Us form submission
router.post('/', submitContactMessage);

module.exports = router;
