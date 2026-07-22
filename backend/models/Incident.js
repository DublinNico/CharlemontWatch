const mongoose = require('mongoose');

// A single uploaded photo attached to an incident. Starts unapproved and is
// only shown publicly once an admin approves it (or the whole incident).
const photoSchema = new mongoose.Schema({
  url: String,
  uploadedAt: { type: Date, default: Date.now },
  caption: String,
  approved: { type: Boolean, default: false }
});

// The core incident report schema. Type-specific fields (graffiti/antisocial/
// safetyhazard/maintenance) all live on the same document rather than using
// discriminators, since only one set is ever populated per incident.
const incidentSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    index: true
  },

  incidentType: {
    type: String,
    enum: ['graffiti', 'antisocial', 'safetyhazard', 'maintenance'],
    required: true,
    index: true
  },

  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    default: 'PENDING_REVIEW',
    required: true,
    index: true
  },
  reportedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Always required — lets a reporter stay anonymous (no name/address) while
  // still confirming they live in the complex and enabling status updates.
  reporterEmail: {
    type: String,
    required: true,
    validate: {
      validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },

  // Graffiti-specific fields
  surfaceType: String,
  estimatedArea: Number,
  isProfane: Boolean,

  // Anti-social-specific fields
  antisocialType: String,
  estimatedPeopleInvolved: Number,

  // Safety hazard-specific fields
  hazardType: String,
  riskLevel: String,
  causedInjury: Boolean,

  // Maintenance-specific fields
  issueType: String,
  priority: String,
  customIssueDescription: String,
  workCategory: String,

  photos: [photoSchema],

  // Formal complaint fields — only required/populated when user opts to send a complaint
  complainantName: String,
  complainantAddress: String,
  sendComplaintTo: [{ type: String, enum: ['tuath', 'dcc'] }],

  // Populated by the Resend bounce webhook (webhookController.js) when a
  // complaint email to Túath/DCC bounces, gets marked spam, or is delayed —
  // lets the resident see on /track that their complaint didn't land, instead
  // of the tracking page looking identical to a successful send.
  complaintDeliveryIssues: [{
    recipientType: { type: String, enum: ['tuath', 'dcc'] },
    eventType: String,
    occurredAt: { type: Date, default: Date.now }
  }],

  // Populated once a complaint email to a recipient actually sends
  // successfully (see emailService.sendComplaintEmails) — lets the admin
  // dashboard show a real "sent" confirmation instead of just assuming the
  // fire-and-forget send after approval worked.
  complaintsSent: [{
    recipientType: { type: String, enum: ['tuath', 'dcc'], required: true },
    sentAt: { type: Date, default: Date.now, required: true }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);
