const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { submitVote, getSummary } = require('../controllers/satisfactionController');

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many vote submissions, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Public: submit or change a satisfaction vote (upserted by email)
router.post('/', voteLimiter, submitVote);

// Public: aggregate counts per rating
router.get('/summary', getSummary);

module.exports = router;
