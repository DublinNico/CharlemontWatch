const { Webhook } = require('svix');
const Sentry = require('@sentry/node');
const Incident = require('../models/Incident');

// Event types that mean a complaint email never reached the recipient (or
// they marked it spam) — the scenario where Túath/DCC's mail server silently
// rejects us and nobody would otherwise know the complaint didn't land.
const DELIVERY_FAILURE_EVENTS = new Set([
  'email.bounced',
  'email.complained',
  'email.delivery_delayed',
]);

// Masks an email's local-part to its first character (e.g.
// "jane@example.com" -> "j***@example.com"). This handler fires on a bounce
// for ANY email sent via Resend, not just Túath/DCC complaints — a resident
// confirmation or status update bouncing would otherwise put a real
// resident's address into server logs and Sentry (a third party).
const maskEmail = (email) => {
  if (typeof email !== 'string') return '***';
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
};

// Receives Resend's delivery webhooks (signed via Svix). Verifies the
// signature, then logs/reports delivery failures with enough context
// (incident + recipient, from the tags set in emailService.js) to act on.
const handleResendWebhook = async (req, res) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not configured — rejecting webhook');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    });
  } catch (err) {
    console.error('Resend webhook signature verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (DELIVERY_FAILURE_EVENTS.has(event.type)) {
    const tags = Object.fromEntries((event.data?.tags || []).map(t => [t.name, t.value]));
    const context = {
      eventType: event.type,
      to: (event.data?.to || []).map(maskEmail),
      incidentId: tags.incident_id,
      recipientType: tags.recipient_type,
    };
    console.error('Resend delivery failure:', JSON.stringify(context));
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(`Resend delivery failure: ${event.type}`, {
        level: 'warning',
        extra: context,
      });
    }

    // Only complaint emails (Túath/DCC) are tagged with incident_id/recipient_type
    // — resident confirmation/status-update emails aren't, so this is skipped
    // for those (nothing on /track to surface for a CharlemontWatch-internal email).
    if (tags.incident_id && tags.recipient_type) {
      try {
        await Incident.updateOne(
          { shortId: tags.incident_id },
          { $push: { complaintDeliveryIssues: { recipientType: tags.recipient_type, eventType: event.type } } }
        );
      } catch (err) {
        console.error('Failed to record complaint delivery issue on incident:', err.message);
      }
    }
  }

  res.status(200).json({ received: true });
};

module.exports = { handleResendWebhook };
