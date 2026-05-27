const mongoose = require('mongoose');

// Schema for photos (each incident can have multiple)
const photoSchema = new mongoose.Schema({
  url: String,
  uploadedAt: { type: Date, default: Date.now },
  caption: String
});

// Main incident schema
const incidentSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    index: true
  },

  // Type of incident (determines which fields are used)
  incidentType: {
    type: String,
    enum: ['graffiti', 'antisocial', 'safetyhazard', 'maintenance'],
    required: true
  },
  
  // Common fields (all incidents have these)
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
    enum: ['NEW', 'IN_PROGRESS', 'RESOLVED'],
    default: 'NEW'
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  reporterEmail: String, // null if anonymous
  
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
  issueType: String, // roof leak, plumbing leak, bin room full, etc., or "other"
  priority: String, // LOW, MEDIUM, HIGH, CRITICAL
  customIssueDescription: String, // if issueType is "other"
  workCategory: String, // structural, electrical, plumbing, etc.
  
  // Photos (up to 10)
  photos: [photoSchema],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);