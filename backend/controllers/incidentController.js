const Incident = require('../models/Incident');
const s3 = require('../config/s3');
const crypto = require('crypto');
const sharp = require('sharp');
const { generateShortId } = require('../utils/idUtils');
const { EMAIL_REGEX } = require('../utils/validators');
const { sendResidentConfirmation, sendAdminNotification, sendStatusUpdate, sendComplaintEmails } = require('../services/emailService');

const ACTIVE_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

// Looks an incident up by its human-friendly shortId first, falling back to
// the raw MongoDB ObjectId — lets both the public tracking page and admin
// routes accept either identifier
const findByAnyId = async (id) => {
  return await Incident.findOne({ shortId: id }) ||
         await Incident.findById(id).catch(() => null);
};

// Downscale and re-encode as JPEG before upload — caps storage/bandwidth cost
// for full-resolution phone photos while keeping evidence clearly legible.
const compressImage = (buffer) => sharp(buffer)
  .rotate()
  .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toBuffer();

// Create incident (report) — public endpoint, no login required.
// Validates the submission, uploads any photos, saves the incident as
// PENDING_REVIEW, and fires off confirmation/notification/complaint emails.
const createIncident = async (req, res) => {
  try {

    const { incidentType, location, description, reporterEmail,
            complainantName, complainantAddress } = req.body;

    // sendComplaintTo is a comma-separated string from the multipart form;
    // only 'tuath'/'dcc' values survive the filter
    const sendComplaintTo = req.body.sendComplaintTo
      ? String(req.body.sendComplaintTo).split(',').map(v => v.trim()).filter(v => ['tuath', 'dcc'].includes(v))
      : [];

    // Required-field validation — runs before any DB or type-specific logic
    const VALID_TYPES = ['graffiti', 'antisocial', 'safetyhazard', 'maintenance'];
    if (!incidentType || !VALID_TYPES.includes(incidentType)) {
      return res.status(400).json({ error: 'incidentType must be one of: graffiti, antisocial, safetyhazard, maintenance' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'location is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'description is required' });
    }
    // Email is required on every report (anonymous or not) — confirms the
    // reporter lives in the complex and enables status-update emails
    if (!reporterEmail || !EMAIL_REGEX.test(reporterEmail)) {
      return res.status(400).json({ error: 'a valid email is required' });
    }
    // Name/address are only required when escalating to a formal complaint
    if (sendComplaintTo.length > 0) {
      if (!complainantName || !complainantName.trim()) {
        return res.status(400).json({ error: 'name is required to send a formal complaint' });
      }
      if (!complainantAddress || !complainantAddress.trim()) {
        return res.status(400).json({ error: 'address is required to send a formal complaint' });
      }
    }

    // Pull out only the fields relevant to the selected incident type
    const typeData = {};
    if (incidentType === 'graffiti') {
      typeData.surfaceType = req.body.surfaceType;
      typeData.estimatedArea = req.body.estimatedArea;
      typeData.isProfane = req.body.isProfane === 'true';
    } else if (incidentType === 'antisocial') {
      typeData.antisocialType = req.body.antisocialType;
      typeData.estimatedPeopleInvolved = req.body.estimatedPeopleInvolved;
    } else if (incidentType === 'safetyhazard') {
      typeData.hazardType = req.body.hazardType;
      typeData.riskLevel = req.body.riskLevel;
      typeData.causedInjury = req.body.causedInjury === 'true';
    } else if (incidentType === 'maintenance') {
      typeData.issueType = req.body.issueType;
      typeData.priority = req.body.priority;
      typeData.customIssueDescription = req.body.customIssueDescription;
      typeData.workCategory = req.body.workCategory;
    }

    // Compress and upload each photo (max 10); a failed upload is logged and
    // skipped rather than failing the whole report
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files.slice(0, 10)) {
        const key = `incidents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
        try {
          const compressed = await compressImage(file.buffer);
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: compressed,
            ContentType: 'image/jpeg'
          };
          await s3.upload(params).promise();
          photos.push({
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            uploadedAt: new Date(),
            approved: false
          });
        } catch (error) {
          console.error('S3 upload error:', error);
        }
      }
    }

    // Persist the incident — complainant fields are only stored if a
    // complaint was actually requested
    const incident = new Incident({
      shortId: generateShortId(),
      incidentType,
      location,
      description,
      reporterEmail,
      photos,
      ...typeData,
      ...(sendComplaintTo.length > 0 ? { complainantName, complainantAddress, sendComplaintTo } : {})
    });

    await incident.save();

    // Fire-and-forget notification emails — failures here don't affect the
    // API response, they're logged inside emailService itself.
    // Note: the formal complaint itself is NOT sent here — it's held until
    // an admin approves the incident (see reviewIncident) so Túath/DCC never
    // receive a complaint that hasn't been moderated.
    sendResidentConfirmation(incident, incident.reporterEmail);
    sendAdminNotification(incident);

    res.status(201).json({
      success: true,
      incidentId: incident.shortId,
      message: `Incident ${incident.shortId} reported successfully`
    });
  } catch (error) {
    console.error('Create incident error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get single incident (public — reporters can track their own pending submission)
const getIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findOne({ shortId: id }) ||
                     await Incident.findById(id).catch(() => null);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all incidents (public — PENDING_REVIEW and REJECTED are never returned).
// Supports optional ?status= and ?type= filters, both restricted to
// publicly-visible values.
const getAllIncidents = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status && ACTIVE_STATUSES.includes(status)) {
      filter.status = status;
    } else {
      filter.status = { $in: ACTIVE_STATUSES };
    }

    if (type) filter.incidentType = type;

    const incidents = await Incident.find(filter).sort({ reportedDate: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all pending incidents (admin only) — the moderation queue
const getPendingIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ status: 'PENDING_REVIEW' }).sort({ reportedDate: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve or reject a pending incident (admin only). Approving publishes it
// to the public feed (status NEW), marks all its photos approved, and — if
// the resident requested one — sends the formal complaint to Túath/DCC for
// the first time. Rejecting hides it permanently and no complaint is ever sent.
const reviewIncident = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const incident = await findByAnyId(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    if (incident.status !== 'PENDING_REVIEW') {
      return res.status(409).json({ error: 'Incident is not pending review' });
    }

    if (action === 'approve') {
      incident.status = 'NEW';
    } else {
      incident.status = 'REJECTED';
    }

    incident.updatedAt = new Date();
    await incident.save();

    if (action === 'approve' && incident.sendComplaintTo?.length > 0) {
      sendComplaintEmails(incident, {
        name: incident.complainantName,
        address: incident.complainantAddress,
        email: incident.reporterEmail,
      }, incident.sendComplaintTo);
    }

    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve or reject an individual photo while incident is in review (admin only)
const reviewPhoto = async (req, res) => {
  try {
    const incident = await findByAnyId(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    if (typeof req.body.approved !== 'boolean') {
      return res.status(400).json({ error: 'approved must be a boolean' });
    }

    if (incident.status !== 'PENDING_REVIEW') {
      return res.status(409).json({ error: 'Incident is not pending review' });
    }

    const photo = incident.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    photo.approved = req.body.approved;
    await incident.save();

    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update incident status (admin only — active statuses only).
// Progresses an already-approved incident through NEW -> IN_PROGRESS -> RESOLVED
// and emails the reporter about the change.
const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ACTIVE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const incident = await findByAnyId(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    incident.status = status;
    incident.updatedAt = new Date();
    await incident.save();

    sendStatusUpdate(incident, incident.reporterEmail);

    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add photo to existing incident (admin only) — used to attach further
// evidence after the initial report, e.g. follow-up photos
const addPhoto = async (req, res) => {
  try {
    const incident = await findByAnyId(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    if (incident.photos.length >= 10) {
      return res.status(400).json({ error: 'Maximum 10 photos allowed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const key = `incidents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    const compressed = await compressImage(req.file.buffer);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: compressed,
      ContentType: 'image/jpeg'
    };

    await s3.upload(params).promise();

    incident.photos.push({
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      uploadedAt: new Date(),
      caption: req.body.caption || '',
      approved: false
    });

    await incident.save();
    res.json({ success: true, incident });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete incident (admin only) — permanent, not a soft delete
const deleteIncident = async (req, res) => {
  try {
    const incident = await findByAnyId(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    await incident.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createIncident,
  getIncident,
  getAllIncidents,
  getPendingIncidents,
  reviewIncident,
  reviewPhoto,
  updateIncidentStatus,
  deleteIncident,
  addPhoto
};
