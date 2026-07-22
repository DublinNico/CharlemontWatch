const mockSend = jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({});

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend }
  }))
}));

// This test file has no real MongoDB connection, so without mocking this,
// sendComplaintEmails' fire-and-forget Incident.findByIdAndUpdate call would
// buffer forever waiting to connect and hang every test that awaits it.
jest.mock('../../models/Incident', () => ({
  findByIdAndUpdate: (...args) => mockFindByIdAndUpdate(...args)
}));

process.env.RESEND_API_KEY = 'test-key';
process.env.RESEND_FROM_EMAIL = 'reports@charlemontwatch.ie';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin@charlemontwatch.ie';
process.env.TUATH_COMPLAINT_EMAIL = 'tuath@charlemontwatch.ie';
process.env.DCC_COMPLAINT_EMAIL = 'dcc@charlemontwatch.ie';

const {
  sendResidentConfirmation,
  sendAdminNotification,
  sendStatusUpdate,
  sendComplaintEmails,
  sendContactMessage,
} = require('../../services/emailService');

const mockIncident = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  shortId: 'CW-ABC123',
  incidentType: 'graffiti',
  location: 'Block A, Charlemont Street',
  description: 'Graffiti found on the south wall',
  status: 'NEW',
  reportedDate: new Date('2025-05-27T10:00:00Z'),
  photos: [],
  reporterEmail: 'jane@example.com',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ data: { id: 'mock-id' }, error: null });
  mockFindByIdAndUpdate.mockResolvedValue({});
});

// ─── sendResidentConfirmation ─────────────────────────────────────────────────

describe('sendResidentConfirmation', () => {
  test('UT-011-A: does NOT call mockSend when residentEmail is null', async () => {
    await sendResidentConfirmation(mockIncident, null);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('UT-011-B: does NOT call mockSend when residentEmail is undefined', async () => {
    await sendResidentConfirmation(mockIncident, undefined);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('UT-011-C: calls mockSend exactly once when a valid email is provided', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('UT-011-D: email is addressed to the resident', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.to).toContain('resident@test.com');
  });

  test('UT-011-E: email subject contains the incident shortId', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-011-F: email is sent from the configured sender address', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.from).toBe('reports@charlemontwatch.ie');
  });
});

// ─── sendStatusUpdate ─────────────────────────────────────────────────────────

describe('sendStatusUpdate', () => {
  test('UT-012-A: does NOT call mockSend when residentEmail is null', async () => {
    await sendStatusUpdate(mockIncident, null);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('UT-012-B: does NOT call mockSend when residentEmail is undefined', async () => {
    await sendStatusUpdate(mockIncident, undefined);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('UT-012-C: calls mockSend exactly once when a valid email is provided', async () => {
    await sendStatusUpdate(mockIncident, 'resident@test.com');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('UT-012-D: email is addressed to the resident', async () => {
    await sendStatusUpdate(mockIncident, 'resident@test.com');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.to).toContain('resident@test.com');
  });
});

// ─── sendAdminNotification ────────────────────────────────────────────────────

describe('sendAdminNotification', () => {
  test('UT-013: calls mockSend and addresses email to ADMIN_EMAIL', async () => {
    await sendAdminNotification(mockIncident);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.to).toContain('admin@charlemontwatch.ie');
  });

  test('UT-013-B: subject contains the incident location', async () => {
    await sendAdminNotification(mockIncident);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).toContain('Block A, Charlemont Street');
  });

  test('UT-044: strips CR/LF from the incident location in the subject line (header injection)', async () => {
    const injectedIncident = { ...mockIncident, location: 'Block A\r\nBcc: attacker@evil.com' };
    await sendAdminNotification(injectedIncident);
    const msg = mockSend.mock.calls[0][0];
    // No newline means "Bcc: ..." can't start a new header — it's just inert subject text
    expect(msg.subject).not.toMatch(/[\r\n]/);
    expect(msg.subject.split('\n')).toHaveLength(1);
  });
});

// ─── sendComplaintEmails ──────────────────────────────────────────────────────

const mockComplainant = {
  name: 'Jane Resident',
  address: 'Apt 12, Charlemont Street, Dublin 2',
  email: 'jane@example.com',
};

describe('sendComplaintEmails', () => {
  test('UT-038-A: sends to Túath only when recipients is ["tuath"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-038-B: sends to DCC only when recipients is ["dcc"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-038-C: sends two emails when recipients is ["tuath", "dcc"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath', 'dcc']);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  test('UT-038-D: sends no emails when recipients is empty', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, []);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('UT-038-E: Túath email contains complainant name', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain('Jane Resident');
  });

  test('UT-047: CCs the complainant on the Túath email so they get a copy', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.cc).toEqual(['jane@example.com']);
  });

  test('UT-048: CCs the complainant on the DCC email so they get a copy', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.cc).toEqual(['jane@example.com']);
  });

  test('UT-045: strips CR/LF from the incident location in the Túath complaint subject line', async () => {
    const injectedIncident = { ...mockIncident, location: 'Block A\r\nBcc: attacker@evil.com' };
    await sendComplaintEmails(injectedIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).not.toMatch(/[\r\n]/);
    expect(msg.subject.split('\n')).toHaveLength(1);
  });

  test('UT-046: strips CR/LF from the incident location in the DCC complaint subject line', async () => {
    const injectedIncident = { ...mockIncident, location: 'Block A\r\nBcc: attacker@evil.com' };
    await sendComplaintEmails(injectedIncident, mockComplainant, ['dcc']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).not.toMatch(/[\r\n]/);
    expect(msg.subject.split('\n')).toHaveLength(1);
  });

  test('UT-049: From header is just "CharlemontWatch", not the complainant\'s name', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.from).toBe('"CharlemontWatch" <reports@charlemontwatch.ie>');
    expect(msg.from).not.toContain('Jane Resident');
  });

  test('UT-050: From header is unaffected by the complainant name, even a malicious one', async () => {
    const injectedComplainant = { ...mockComplainant, name: 'Jane\r\nBcc: attacker@evil.com "quoted"' };
    await sendComplaintEmails(mockIncident, injectedComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.from).toBe('"CharlemontWatch" <reports@charlemontwatch.ie>');
  });

  test('UT-051: body tells the recipient to correspond directly with the resident, not CharlemontWatch', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain('correspond directly with the resident');
    expect(msg.html).toContain('jane@example.com');
  });

  test('UT-052: includes photo thumbnails and a tracking link when photos exist', async () => {
    const incidentWithPhotos = {
      ...mockIncident,
      photos: [{ url: 'https://bucket.s3.amazonaws.com/photo1.jpg' }, { url: 'https://bucket.s3.amazonaws.com/photo2.jpg' }],
    };
    await sendComplaintEmails(incidentWithPhotos, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain('https://bucket.s3.amazonaws.com/photo1.jpg');
    expect(msg.html).toContain('https://bucket.s3.amazonaws.com/photo2.jpg');
    expect(msg.html).toContain(`/track?id=${incidentWithPhotos.shortId}`);
  });

  test('UT-053: omits the photo section entirely when there are no photos', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).not.toContain('Photo Evidence');
  });

  test('UT-053-A: Túath email still includes the tracking link when there are no photos', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain(`View this report on CharlemontWatch`);
    expect(msg.html).toContain(`/track?id=${mockIncident.shortId}`);
  });

  test('UT-053-B: DCC email still includes the tracking link when there are no photos', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain(`View this report on CharlemontWatch`);
    expect(msg.html).toContain(`/track?id=${mockIncident.shortId}`);
  });

  test('UT-053-C: Túath email footer link is built from FRONTEND_URL', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain(`via <a href="${process.env.FRONTEND_URL}">CharlemontWatch</a>`);
  });

  test('UT-053-D: DCC email footer link is built from FRONTEND_URL', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain(`via <a href="${process.env.FRONTEND_URL}">CharlemontWatch</a>`);
  });

  test('UT-038-F: DCC email contains incident location', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).toContain('Block A, Charlemont Street');
  });

  test('UT-059-A: records a successful send on the incident for each recipient', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath', 'dcc']);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(2);
    const recordedTypes = mockFindByIdAndUpdate.mock.calls.map(([, update]) => update.$push.complaintsSent.recipientType);
    expect(recordedTypes.sort()).toEqual(['dcc', 'tuath']);
  });

  test('UT-059-B: does not record a send when Resend itself fails', async () => {
    mockSend.mockRejectedValue(new Error('Resend down'));
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('UT-059-C: a persistence failure recording the sent confirmation does not reject sendComplaintEmails', async () => {
    mockFindByIdAndUpdate.mockRejectedValue(new Error('Mongo unavailable'));
    await expect(
      sendComplaintEmails(mockIncident, mockComplainant, ['tuath'])
    ).resolves.toBeUndefined();
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  test('UT-038-G: swallows Resend errors silently', async () => {
    mockSend.mockRejectedValue(new Error('Resend down'));
    await expect(
      sendComplaintEmails(mockIncident, mockComplainant, ['tuath', 'dcc'])
    ).resolves.toBeUndefined();
  });

  test('UT-038-H: HTML-special chars in complainant name are escaped in email body', async () => {
    const xssComplainant = { name: '<script>alert(1)</script>', address: '1 Test St', email: 'x@x.com' };
    await sendComplaintEmails(mockIncident, xssComplainant, ['tuath']);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('UT-038-I: HTML-special chars in incident description are escaped in email body', async () => {
    const xssIncident = { ...mockIncident, description: '<img src=x onerror=alert(1)>' };
    await sendComplaintEmails(xssIncident, mockComplainant, ['dcc']);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

// ─── sendContactMessage ───────────────────────────────────────────────────────

describe('sendContactMessage', () => {
  test('UT-054: sends to ADMIN_EMAIL with Reply-To set to the sender', async () => {
    await sendContactMessage('Jane Resident', 'jane@example.com', 'Hello there');
    expect(mockSend).toHaveBeenCalledTimes(1);
    const msg = mockSend.mock.calls[0][0];
    expect(msg.to).toContain('admin@charlemontwatch.ie');
    expect(msg.replyTo).toBe('jane@example.com');
  });

  test('UT-055: subject and body contain the sender name and message', async () => {
    await sendContactMessage('Jane Resident', 'jane@example.com', 'Hello there');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).toContain('Jane Resident');
    expect(msg.html).toContain('Hello there');
    expect(msg.html).toContain('jane@example.com');
  });

  test('UT-056: strips CR/LF from the sender name in the subject line', async () => {
    await sendContactMessage('Jane\r\nBcc: attacker@evil.com', 'jane@example.com', 'Hi');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.subject).not.toMatch(/[\r\n]/);
  });

  test('UT-057: HTML-special chars in the message are escaped', async () => {
    await sendContactMessage('Jane', 'jane@example.com', '<script>alert(1)</script>');
    const msg = mockSend.mock.calls[0][0];
    expect(msg.html).not.toContain('<script>');
    expect(msg.html).toContain('&lt;script&gt;');
  });

  test('UT-058: swallows Resend errors silently', async () => {
    mockSend.mockRejectedValue(new Error('Resend down'));
    await expect(
      sendContactMessage('Jane', 'jane@example.com', 'Hi')
    ).resolves.toBeUndefined();
  });
});

// ─── catch-path coverage ──────────────────────────────────────────────────────

describe('email service — catch paths (Resend failure)', () => {
  beforeEach(() => {
    mockSend.mockRejectedValue(new Error('Resend unavailable'));
  });

  test('UT-035: sendResidentConfirmation swallows SendGrid errors silently', async () => {
    await expect(
      sendResidentConfirmation(mockIncident, 'resident@test.com')
    ).resolves.toBeUndefined();
  });

  test('UT-036: sendAdminNotification swallows SendGrid errors silently', async () => {
    await expect(
      sendAdminNotification(mockIncident)
    ).resolves.toBeUndefined();
  });

  test('UT-037: sendStatusUpdate swallows SendGrid errors silently', async () => {
    await expect(
      sendStatusUpdate(mockIncident, 'resident@test.com')
    ).resolves.toBeUndefined();
  });
});
