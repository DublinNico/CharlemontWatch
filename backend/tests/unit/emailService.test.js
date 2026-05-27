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
