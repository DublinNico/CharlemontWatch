const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncident,
  getAllIncidents,
  updateIncidentStatus,
  deleteIncident,
  addPhoto
} = require('../controllers/incidentController');
const { authenticate, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public: Report incident (anyone, anonymous or logged in)
router.post('/report', upload.array('photos', 10), createIncident);

// Admin only: Update incident status
router.patch('/admin/:id/status', authenticate, adminOnly, updateIncidentStatus);

// Admin only: Delete incident
router.delete('/admin/:id', authenticate, adminOnly, deleteIncident);

// Public: Get all incidents (with optional filters)
router.get('/', getAllIncidents);

// Public: Get single incident
router.get('/:id', getIncident);

// Logged in: Add photo to incident
router.post('/:id/photos', authenticate, upload.single('photo'), addPhoto);

module.exports = router;