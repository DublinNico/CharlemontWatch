const express = require('express');
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

// Public: Report incident
router.post('/report', upload.array('photos', 10), validateMagicBytes, createIncident);

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
router.post('/:id/photos', authenticate, upload.single('photo'), validateMagicBytes, addPhoto);

module.exports = router;
