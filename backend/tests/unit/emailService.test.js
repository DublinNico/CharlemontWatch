jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_FROM_EMAIL = 'reports@charlemontwatch.ie';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin@charlemontwatch.ie';

const sgMail = require('@sendgrid/mail');
const {
  sendResidentConfirmation,
  sendAdminNotification,
  sendStatusUpdate,
  sendComplaintEmails,
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
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── sendResidentConfirmation ─────────────────────────────────────────────────

describe('sendResidentConfirmation', () => {
  test('UT-011-A: does NOT call sgMail.send when residentEmail is null', async () => {
    await sendResidentConfirmation(mockIncident, null);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-011-B: does NOT call sgMail.send when residentEmail is undefined', async () => {
    await sendResidentConfirmation(mockIncident, undefined);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-011-C: calls sgMail.send exactly once when a valid email is provided', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  test('UT-011-D: email is addressed to the resident', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.to).toBe('resident@test.com');
  });

  test('UT-011-E: email subject contains the incident shortId', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-011-F: email is sent from the configured sender address', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.from).toBe('reports@charlemontwatch.ie');
  });
});

// ─── sendStatusUpdate ─────────────────────────────────────────────────────────

describe('sendStatusUpdate', () => {
  test('UT-012-A: does NOT call sgMail.send when residentEmail is null', async () => {
    await sendStatusUpdate(mockIncident, null);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-012-B: does NOT call sgMail.send when residentEmail is undefined', async () => {
    await sendStatusUpdate(mockIncident, undefined);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-012-C: calls sgMail.send exactly once when a valid email is provided', async () => {
    await sendStatusUpdate(mockIncident, 'resident@test.com');
    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  test('UT-012-D: email is addressed to the resident', async () => {
    await sendStatusUpdate(mockIncident, 'resident@test.com');
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.to).toBe('resident@test.com');
  });
});

// ─── sendAdminNotification ────────────────────────────────────────────────────

describe('sendAdminNotification', () => {
  test('UT-013: calls sgMail.send and addresses email to ADMIN_EMAIL', async () => {
    await sendAdminNotification(mockIncident);
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.to).toBe('admin@charlemontwatch.ie');
  });

  test('UT-013-B: subject contains the incident location', async () => {
    await sendAdminNotification(mockIncident);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.subject).toContain('Block A, Charlemont Street');
  });
});

// ─── sendComplaintEmails ──────────────────────────────────────────────────────

const mockComplainant = {
  name: 'Jane Resident',
  email: 'jane@example.com',
  phone: '087 123 4567',
};

describe('sendComplaintEmails', () => {
  test('UT-038-A: sends to Tuath only when recipients is ["tuath"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-038-B: sends to DCC only when recipients is ["dcc"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });

  test('UT-038-C: sends two emails when recipients is ["tuath", "dcc"]', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath', 'dcc']);
    expect(sgMail.send).toHaveBeenCalledTimes(2);
  });

  test('UT-038-D: sends no emails when recipients is empty', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, []);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-038-E: Tuath email contains complainant name', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['tuath']);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.html).toContain('Jane Resident');
  });

  test('UT-038-F: DCC email contains incident location', async () => {
    await sendComplaintEmails(mockIncident, mockComplainant, ['dcc']);
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.html).toContain('Block A, Charlemont Street');
  });

  test('UT-038-G: swallows SendGrid errors silently', async () => {
    sgMail.send.mockRejectedValue(new Error('SendGrid down'));
    await expect(
      sendComplaintEmails(mockIncident, mockComplainant, ['tuath', 'dcc'])
    ).resolves.toBeUndefined();
  });

  test('UT-038-H: HTML-special chars in complainant name are escaped in email body', async () => {
    const xssComplainant = { name: '<script>alert(1)</script>', email: 'x@x.com', phone: '087' };
    await sendComplaintEmails(mockIncident, xssComplainant, ['tuath']);
    const html = sgMail.send.mock.calls[0][0].html;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('UT-038-I: HTML-special chars in incident description are escaped in email body', async () => {
    const xssIncident = { ...mockIncident, description: '<img src=x onerror=alert(1)>' };
    await sendComplaintEmails(xssIncident, mockComplainant, ['dcc']);
    const html = sgMail.send.mock.calls[0][0].html;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

// ─── catch-path coverage ──────────────────────────────────────────────────────

describe('email service — catch paths (SendGrid failure)', () => {
  beforeEach(() => {
    sgMail.send.mockRejectedValue(new Error('SendGrid unavailable'));
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
