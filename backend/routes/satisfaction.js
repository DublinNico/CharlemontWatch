const express = require('express');
const router = express.Router();
const { submitVote, getSummary } = require('../controllers/satisfactionController');

// Public: submit or change a satisfaction vote (upserted by email)
router.post('/', submitVote);

// Public: aggregate counts per rating
router.get('/summary', getSummary);

module.exports = router;
