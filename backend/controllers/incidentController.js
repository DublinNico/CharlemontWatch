const Incident = require('../models/Incident');
const s3 = require('../config/s3');
const crypto = require('crypto');
const { generateShortId } = require('../utils/idUtils');
const { sendResidentConfirmation, sendAdminNotification, sendStatusUpdate } = require('../services/emailService');

// Create incident (report)
const createIncident = async (req, res) => {
  try {
    const { incidentType, location, description, reporterEmail } = req.body;
    
    // Parse type-specific fields
    const typeData = {};
    
    if (incidentType === 'graffiti') {
      typeData.surfaceType = req.body.surfaceType;
      typeData.estimatedArea = req.body.estimatedArea;
      typeData.isProfane = req.body.isProfane === 'true';
    } else if (incidentType === 'antisocial') {
      typeData.antisocialType = req.body.antisocialType;
      typeData.estimatedPeopleInvolved = req.body.estimatedPeopleInvolved;
      typeData.reportedToGarda = req.body.reportedToGarda === 'true';
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
    
    // Upload photos to S3 if provided
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files.slice(0, 10)) {
        const key = `incidents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
        
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        };
        
        try {
          await s3.upload(params).promise();
          photos.push({
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            uploadedAt: new Date()
          });
        } catch (error) {
          console.error('S3 upload error:', error);
        }
      }
    }
    
    const incident = new Incident({
      shortId: generateShortId(),
      incidentType,
      location,
      description,
      reporterEmail: reporterEmail || null,
      photos,
      ...typeData
    });
    
    await incident.save();
    
    // Send confirmation emails (async, don't wait)
    sendResidentConfirmation(incident, incident.reporterEmail);
    sendAdminNotification(incident);
    
    res.status(201).json({
      success: true,
      incidentId: incident.shortId,
      message: `Incident ${incident.shortId} reported successfully`
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single incident (public - anyone can view)
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

// Get all incidents (public - anyone can view)
const getAllIncidents = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.incidentType = type;

    const incidents = await Incident.find(filter).sort({ reportedDate: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update incident status (admin only)
const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Notify resident of status change
    sendStatusUpdate(incident, incident.reporterEmail);
    
    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add photo to existing incident
const addPhoto = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    if (incident.photos.length >= 10) {
      return res.status(400).json({ error: 'Maximum 10 photos allowed' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const key = `incidents/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };
    
    await s3.upload(params).promise();
    
    incident.photos.push({
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      uploadedAt: new Date(),
      caption: req.body.caption || ''
    });
    
    await incident.save();
    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete incident (admin only)
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createIncident,
  getIncident,
  getAllIncidents,
  updateIncidentStatus,
  deleteIncident,
  addPhoto
};