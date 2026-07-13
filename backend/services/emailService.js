const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const escapeHtml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getIncidentTypeName = (type) => {
  const names = {
    graffiti: 'Graffiti Report',
    antisocial: 'Anti-Social Behaviour',
    safetyhazard: 'Safety Hazard',
    maintenance: 'Maintenance Request'
  };
  return names[type] || type;
};

const send = async (msg) => {
  if (!resend) { console.warn('Resend not configured — email skipped'); return; }
  const { error } = await resend.emails.send(msg);
  if (error) throw error;
};

// Send email to resident confirming report received
const sendResidentConfirmation = async (incident, residentEmail) => {
  if (!residentEmail) return;

  const trackingLink = `${process.env.FRONTEND_URL}/track`;

  try {
    await send({
      from: FROM,
      to: [residentEmail],
      subject: `Your Incident Report ${incident.shortId} - CharlemontWatch`,
      html: `
        <h2>Thank you for reporting this incident</h2>
        <p>Your report has been received. Use the ID below to track its status:</p>

        <div style="background:#f5f5f5;border:2px dashed #1976d2;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <p style="margin:0;font-size:13px;color:#666;">Your Incident ID</p>
          <p style="margin:8px 0 0;font-size:24px;font-weight:700;letter-spacing:3px;color:#1976d2;">${incident.shortId}</p>
        </div>

        <p><strong>Location:</strong> ${escapeHtml(incident.location)}</p>
        <p><strong>Type:</strong> ${escapeHtml(getIncidentTypeName(incident.incidentType))}</p>
        <p><strong>Status:</strong> ${escapeHtml(incident.status)}</p>

        <p>To track your report, go to <a href="${trackingLink}">${trackingLink}</a> and enter your Incident ID.</p>
        <p>We'll email you when the status changes.</p>
        <p>CharlemontWatch Team</p>
      `
    });
    console.log(`Resident confirmation email sent to ${residentEmail}`);
  } catch (error) {
    console.error('Failed to send resident email:', error);
  }
};

// Send email to admin notifying of new incident
const sendAdminNotification = async (incident) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminLink = `${process.env.FRONTEND_URL}/cw-admin?key=${process.env.VITE_ADMIN_KEY || ''}`;

  try {
    await send({
      from: FROM,
      to: [adminEmail],
      subject: `[NEW] ${getIncidentTypeName(incident.incidentType)} at ${incident.location}`,
      html: `
        <h2>New Incident Report</h2>
        <p><strong>ID:</strong> ${incident._id.toString().slice(-8).toUpperCase()}</p>
        <p><strong>Type:</strong> ${escapeHtml(getIncidentTypeName(incident.incidentType))}</p>
        <p><strong>Location:</strong> ${escapeHtml(incident.location)}</p>
        <p><strong>Description:</strong> ${escapeHtml(incident.description)}</p>
        <p><strong>Reporter:</strong> ${escapeHtml(incident.reporterEmail)}</p>
        <p><strong>Reported:</strong> ${incident.reportedDate.toLocaleString()}</p>
        ${incident.photos.length > 0 ? `<p><strong>Photos:</strong> ${incident.photos.length} uploaded</p>` : ''}
        <p><a href="${adminLink}">View in Admin Dashboard</a></p>
      `
    });
    console.log(`Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('Failed to send admin email:', error);
  }
};

// Send status update email to resident
const sendStatusUpdate = async (incident, residentEmail) => {
  if (!residentEmail) return;

  const trackingLink = `${process.env.FRONTEND_URL}/track/${incident._id}`;
  const statusMessages = {
    NEW: 'Your report has been received and is waiting to be processed.',
    IN_PROGRESS: 'Work has started on your report. We\'re on it!',
    RESOLVED: 'Your report has been resolved. Thank you for helping keep Charlemont safe!'
  };

  try {
    await send({
      from: FROM,
      to: [residentEmail],
      subject: `Incident #${incident._id.toString().slice(-8).toUpperCase()} - Status: ${incident.status}`,
      html: `
        <h2>Status Update</h2>
        <p>Your incident (ID: ${incident._id.toString().slice(-8).toUpperCase()}) status has changed.</p>
        <p><strong>New Status:</strong> ${incident.status}</p>
        <p>${statusMessages[incident.status]}</p>
        <p><a href="${trackingLink}">View Full Report</a></p>
      `
    });
    console.log(`Status update email sent to ${residentEmail}`);
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }
};

// Send formal complaint email(s) to Túath Housing and/or Dublin City Council
const sendComplaintEmails = async (incident, complainant, recipients) => {
  const incidentTypeName = getIncidentTypeName(incident.incidentType);
  const reportedDate = new Date(incident.reportedDate).toLocaleDateString('en-IE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const sharedIncidentBlock = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;width:160px;">Incident ID</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(incident.shortId)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Type</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(incidentTypeName)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(incident.location)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Date Reported</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(reportedDate)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Description</td><td style="padding:6px 12px;">${escapeHtml(incident.description)}</td></tr>
    </table>
  `;

  const complainantBlock = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;width:160px;">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(complainant.name)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Address</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(complainant.address)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Email</td><td style="padding:6px 12px;">${escapeHtml(complainant.email)}</td></tr>
    </table>
  `;

  const sends = [];

  if (recipients.includes('tuath')) {
    if (!process.env.TUATH_COMPLAINT_EMAIL) {
      console.error('TUATH_COMPLAINT_EMAIL not configured — Túath complaint skipped');
    } else sends.push(send({
      from: FROM,
      to: [process.env.TUATH_COMPLAINT_EMAIL],
      replyTo: complainant.email,
      subject: `Formal Complaint — ${incidentTypeName} at ${incident.location} [${incident.shortId}]`,
      html: `
        <h2 style="color:#1976d2;">Formal Complaint — Túath Housing</h2>
        <p>A formal complaint has been submitted via CharlemontWatch regarding an incident at a Túath Housing managed area.</p>
        <h3>Complainant Details</h3>
        ${complainantBlock}
        <h3>Incident Details</h3>
        ${sharedIncidentBlock}
        <h3>Nature of Complaint</h3>
        <p>The complainant is reporting an unresolved issue within the Túath Housing managed estate at <strong>${escapeHtml(incident.location)}</strong>.
        They are requesting that Túath Housing investigate and take appropriate action in line with the Túath Housing Complaints Policy & Procedure (v6.0, October 2024).</p>
        <h3>Desired Outcome</h3>
        <p>The complainant requests a written acknowledgement within 5 working days and resolution within 30 working days, as per the Túath Complaints Procedure.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#888;">This complaint was submitted automatically via CharlemontWatch (charlemontwatch.ie).
        The incident reference is ${incident.shortId}. Please retain this for your complaints register.</p>
      `
    }).catch(e => console.error('Túath complaint email failed:', e)));
  }

  if (recipients.includes('dcc')) {
    if (!process.env.DCC_COMPLAINT_EMAIL) {
      console.error('DCC_COMPLAINT_EMAIL not configured — DCC complaint skipped');
    } else sends.push(send({
      from: FROM,
      to: [process.env.DCC_COMPLAINT_EMAIL],
      replyTo: complainant.email,
      subject: `Formal Complaint — ${incidentTypeName} at ${incident.location} [${incident.shortId}]`,
      html: `
        <h2 style="color:#1976d2;">Formal Complaint — Dublin City Council</h2>
        <p>A formal complaint has been submitted via CharlemontWatch regarding an issue within the Dublin City Council area.</p>
        <h3>Complainant Details</h3>
        ${complainantBlock}
        <h3>Incident Details</h3>
        ${sharedIncidentBlock}
        <h3>Nature of Complaint</h3>
        <p>The complainant is reporting an unresolved issue at <strong>${escapeHtml(incident.location)}</strong> and requests that Dublin City Council investigate and take appropriate action.</p>
        <h3>Desired Outcome</h3>
        <p>The complainant requests a formal acknowledgement within 3 working days and a full response within 15 working days, in line with the Dublin City Council Customer Complaints procedure.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#888;">This complaint was submitted automatically via CharlemontWatch (charlemontwatch.ie).
        The incident reference is ${incident.shortId}.</p>
      `
    }).catch(e => console.error('DCC complaint email failed:', e)));
  }

  await Promise.all(sends);
};

module.exports = {
  sendResidentConfirmation,
  sendAdminNotification,
  sendStatusUpdate,
  sendComplaintEmails
};
