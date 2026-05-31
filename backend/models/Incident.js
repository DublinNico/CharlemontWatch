const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: String,
  uploadedAt: { type: Date, default: Date.now },
  caption: String,
  approved: { type: Boolean, default: false }
});

const incidentSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    index: true
  },

  incidentType: {
    type: String,
    enum: ['graffiti', 'antisocial', 'safetyhazard', 'maintenance'],
    required: true
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
    default: Date.now
  },
  reporterEmail: {
    type: String,
    validate: {
      validator: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
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
  reportedToTuath: Boolean,

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

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);
