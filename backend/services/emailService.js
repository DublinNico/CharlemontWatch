const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Escapes HTML special characters in user-supplied text before it's
// interpolated into an email body, preventing HTML/script injection
const escapeHtml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Strips CR/LF (and other control chars) so user input can't inject extra
// headers or split an email subject line.
const sanitizeHeader = (str) => String(str ?? '').replace(/[\r\n\x00-\x1F]+/g, ' ').trim();

// Maps the internal incidentType enum value to a human-readable label used in emails
const getIncidentTypeName = (type) => {
  const names = {
    graffiti: 'Graffiti Report',
    antisocial: 'Anti-Social Behaviour',
    safetyhazard: 'Safety Hazard',
    maintenance: 'Maintenance Request'
  };
  return names[type] || type;
};

// Shared Resend send wrapper — no-ops with a warning if RESEND_API_KEY isn't
// configured (e.g. local dev), so the app still works without real email
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
      replyTo: process.env.ADMIN_EMAIL,
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
      replyTo: incident.reporterEmail,
      subject: `[NEW] ${getIncidentTypeName(incident.incidentType)} at ${sanitizeHeader(incident.location)}`,
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
      replyTo: process.env.ADMIN_EMAIL,
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

  // Shows a few photo thumbnails inline (using the existing public S3 URLs)
  // plus a link back to the tracking page, since some email clients (Outlook
  // especially) block remote images by default — the link is the reliable
  // fallback so the evidence is never more than one click away.
  const trackingLink = `${process.env.FRONTEND_URL}/track?id=${incident.shortId}`;

  // Shown unconditionally, unlike photosBlock below — previously the only
  // clickable link to the site lived inside photosBlock, so a photo-less
  // report gave Túath/DCC no way to view it online at all.
  const trackingLinkBlock = `<p><a href="${trackingLink}">View this report on CharlemontWatch</a></p>`;

  const photosBlock = incident.photos && incident.photos.length > 0 ? `
    <h3>Photo Evidence (${incident.photos.length})</h3>
    <div style="margin:12px 0;">
      ${incident.photos.slice(0, 3).map(p => `
        <a href="${trackingLink}" style="display:inline-block;margin:0 8px 8px 0;">
          <img src="${p.url}" alt="Incident photo" style="width:150px;height:150px;object-fit:cover;border-radius:4px;border:1px solid #ddd;" />
        </a>
      `).join('')}
    </div>
    ${incident.photos.length > 3 ? `<p><a href="${trackingLink}">View all ${incident.photos.length} photos</a></p>` : ''}
  ` : '';

  const complainantBlock = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;width:160px;">Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(complainant.name)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Address</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(complainant.address)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;">Email</td><td style="padding:6px 12px;">${escapeHtml(complainant.email)}</td></tr>
    </table>
  `;

  // Deliberately doesn't put the resident's name in the From display name
  // (e.g. "Jane Resident via CharlemontWatch") — pairing a real person's name
  // with a third-party sending domain reads as friendly-name spoofing to
  // institutional mail filters regardless of SPF/DKIM/DMARC passing. The
  // resident's name is still fully visible in complainantBlock, and replyTo
  // points straight to them.
  const fromHeader = `"CharlemontWatch" <${FROM}>`;

  const correspondenceNote = `
    <p style="background:#fff3e0;border-left:4px solid #f57c00;padding:10px 14px;margin:16px 0;">
      <strong>Please correspond directly with the resident.</strong> All replies to this complaint should go to
      <strong>${escapeHtml(complainant.email)}</strong> (this address is also set as the Reply-To on this email).
      CharlemontWatch is a reporting platform only — it submitted this complaint on the resident's behalf and is
      not a party to it.
    </p>
  `;

  const sends = [];

  if (recipients.includes('tuath')) {
    if (!process.env.TUATH_COMPLAINT_EMAIL) {
      console.error('TUATH_COMPLAINT_EMAIL not configured — Túath complaint skipped');
    } else sends.push(send({
      from: fromHeader,
      to: [process.env.TUATH_COMPLAINT_EMAIL],
      cc: [complainant.email],
      replyTo: complainant.email,
      // Echoed back on bounce/complaint webhook events so a delivery failure
      // can be traced to the specific incident and recipient (see
      // controllers/webhookController.js)
      tags: [
        { name: 'incident_id', value: incident.shortId },
        { name: 'recipient_type', value: 'tuath' },
      ],
      subject: `Formal Complaint — ${incidentTypeName} at ${sanitizeHeader(incident.location)} [${incident.shortId}]`,
      html: `
        <h2 style="color:#1976d2;">Formal Complaint — Túath Housing</h2>
        <p>A formal complaint has been submitted via CharlemontWatch regarding an incident at a Túath Housing managed area.</p>
        ${correspondenceNote}
        <h3>Complainant Details</h3>
        ${complainantBlock}
        <h3>Incident Details</h3>
        ${sharedIncidentBlock}
        ${trackingLinkBlock}
        ${photosBlock}
        <h3>Nature of Complaint</h3>
        <p>The complainant is reporting an unresolved issue within the Túath Housing managed estate at <strong>${escapeHtml(incident.location)}</strong>.
        They are requesting that Túath Housing investigate and take appropriate action in line with the Túath Housing Complaints Policy & Procedure (v6.0, October 2024).</p>
        <h3>Desired Outcome</h3>
        <p>The complainant requests a written acknowledgement within 5 working days and resolution within 30 working days, as per the Túath Complaints Procedure.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#888;">This complaint was submitted automatically via <a href="${process.env.FRONTEND_URL}">CharlemontWatch</a>.
        The incident reference is ${incident.shortId}. Please retain this for your complaints register.</p>
      `
    }).catch(e => console.error('Túath complaint email failed:', e)));
  }

  if (recipients.includes('dcc')) {
    if (!process.env.DCC_COMPLAINT_EMAIL) {
      console.error('DCC_COMPLAINT_EMAIL not configured — DCC complaint skipped');
    } else sends.push(send({
      from: fromHeader,
      to: [process.env.DCC_COMPLAINT_EMAIL],
      cc: [complainant.email],
      replyTo: complainant.email,
      tags: [
        { name: 'incident_id', value: incident.shortId },
        { name: 'recipient_type', value: 'dcc' },
      ],
      subject: `Formal Complaint — ${incidentTypeName} at ${sanitizeHeader(incident.location)} [${incident.shortId}]`,
      html: `
        <h2 style="color:#1976d2;">Formal Complaint — Dublin City Council</h2>
        <p>A formal complaint has been submitted via CharlemontWatch regarding an issue within the Dublin City Council area.</p>
        ${correspondenceNote}
        <h3>Complainant Details</h3>
        ${complainantBlock}
        <h3>Incident Details</h3>
        ${sharedIncidentBlock}
        ${trackingLinkBlock}
        ${photosBlock}
        <h3>Nature of Complaint</h3>
        <p>The complainant is reporting an unresolved issue at <strong>${escapeHtml(incident.location)}</strong> and requests that Dublin City Council investigate and take appropriate action.</p>
        <h3>Desired Outcome</h3>
        <p>The complainant requests a formal acknowledgement within 3 working days and a full response within 15 working days, in line with the Dublin City Council Customer Complaints procedure.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#888;">This complaint was submitted automatically via <a href="${process.env.FRONTEND_URL}">CharlemontWatch</a>.
        The incident reference is ${incident.shortId}.</p>
      `
    }).catch(e => console.error('DCC complaint email failed:', e)));
  }

  await Promise.all(sends);
};

// Send a "Contact Us" form message to the admin, with Reply-To set to the
// sender's own address so admin can just hit reply to respond directly
const sendContactMessage = async (name, email, message) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  try {
    await send({
      from: FROM,
      to: [adminEmail],
      replyTo: email,
      subject: `[Contact Form] Message from ${sanitizeHeader(name)}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      `
    });
    console.log(`Contact form message sent from ${email}`);
  } catch (error) {
    console.error('Failed to send contact form email:', error);
  }
};

module.exports = {
  sendResidentConfirmation,
  sendAdminNotification,
  sendStatusUpdate,
  sendComplaintEmails,
  sendContactMessage
};
