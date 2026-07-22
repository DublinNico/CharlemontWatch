const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  createIncident,
  getIncident,
  getAllIncidents,
  getPendingIncidents,
  reviewIncident,
  reviewPhoto,
  updateIncidentStatus,
  deleteIncident,
  addPhoto
} = require('../controllers/incidentController');
const { authenticate, adminOnly } = require('../middleware/auth');
const { upload, validateMagicBytes } = require('../middleware/upload');

// Throttles report submissions per IP so the public endpoint can't be flooded
// with fake incidents — checked before multer/S3/email work runs
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reports submitted, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Public: Report incident
// mongoSanitize() runs here (not just globally in app.js) because multer parses
// multipart/form-data into req.body at the route level, after the global
// mongoSanitize() middleware has already executed on an empty body.
router.post('/report', reportLimiter, upload.array('photos', 10), validateMagicBytes, mongoSanitize(), createIncident);

// Admin: Get review queue (must be before /:id to avoid param conflict)
router.get('/admin/pending', authenticate, adminOnly, getPendingIncidents);

// Admin: Approve or reject a pending incident
router.patch('/admin/:id/review', authenticate, adminOnly, reviewIncident);

// Admin: Approve or reject an individual photo
router.patch('/admin/:id/photos/:photoId/review', authenticate, adminOnly, reviewPhoto);

// Admin: Update status of an approved incident
router.patch('/admin/:id/status', authenticate, adminOnly, updateIncidentStatus);

// Admin: Delete incident
router.delete('/admin/:id', authenticate, adminOnly, deleteIncident);

// Public: Get all incidents (PENDING_REVIEW and REJECTED excluded)
router.get('/', getAllIncidents);

// Public: Get single incident (reporters can track their pending submission)
router.get('/:id', getIncident);

// Authenticated: Add photo to incident
router.post('/:id/photos', authenticate, upload.single('photo'), validateMagicBytes, mongoSanitize(), addPhoto);

module.exports = router;
