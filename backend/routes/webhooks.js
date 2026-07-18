const express = require('express');
const router = express.Router();
const { handleResendWebhook } = require('../controllers/webhookController');

// Svix (which Resend uses to sign webhooks) verifies against the raw request
// body bytes, so this route needs the unparsed buffer rather than the
// globally-applied express.json() — see app.js for the mount-order note.
router.post('/resend', express.raw({ type: 'application/json' }), handleResendWebhook);

module.exports = router;
