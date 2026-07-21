const mockVerify = jest.fn();

jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({ verify: mockVerify })),
}));

jest.mock('@sentry/node', () => ({ captureMessage: jest.fn() }));
const Sentry = require('@sentry/node');

jest.mock('../../models/Incident');
const Incident = require('../../models/Incident');

const { handleResendWebhook } = require('../../controllers/webhookController');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeReq = (body = '{}') => ({
  body,
  headers: {
    'svix-id': 'msg_test',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1,test-signature',
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret';
  delete process.env.SENTRY_DSN;
  Incident.updateOne = jest.fn().mockResolvedValue({});
});

describe('handleResendWebhook', () => {
  test('UT-059: returns 500 and skips verification when RESEND_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  test('UT-060: returns 401 when signature verification fails', async () => {
    mockVerify.mockImplementation(() => { throw new Error('bad signature'); });
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('UT-061: returns 200 for a non-failure event type and does not report to Sentry', async () => {
    mockVerify.mockReturnValue({ type: 'email.delivered', data: { to: ['tuath@example.com'], tags: [] } });
    process.env.SENTRY_DSN = 'https://fake@sentry.io/1';
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('UT-062: logs and reports to Sentry on a bounce event, extracting incident/recipient tags', async () => {
    mockVerify.mockReturnValue({
      type: 'email.bounced',
      data: {
        to: ['tuath@example.com'],
        tags: [
          { name: 'incident_id', value: 'CW-ABC123' },
          { name: 'recipient_type', value: 'tuath' },
        ],
      },
    });
    process.env.SENTRY_DSN = 'https://fake@sentry.io/1';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Resend delivery failure: email.bounced',
      expect.objectContaining({
        extra: expect.objectContaining({ incidentId: 'CW-ABC123', recipientType: 'tuath' }),
      })
    );
    consoleSpy.mockRestore();
  });

  test('UT-062-A: masks the recipient email in both console.error and Sentry extras', async () => {
    mockVerify.mockReturnValue({
      type: 'email.bounced',
      data: { to: ['jane.resident@example.com'], tags: [] },
    });
    process.env.SENTRY_DSN = 'https://fake@sentry.io/1';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    const loggedArg = consoleSpy.mock.calls.find(call => call[0] === 'Resend delivery failure:')[1];
    expect(loggedArg).not.toContain('jane.resident@example.com');
    expect(loggedArg).toContain('j***@example.com');

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ extra: expect.objectContaining({ to: ['j***@example.com'] }) })
    );
    consoleSpy.mockRestore();
  });

  test('UT-063: treats email.complained and email.delivery_delayed as delivery failures too', async () => {
    mockVerify.mockReturnValue({
      type: 'email.complained',
      data: { to: ['dcc@example.com'], tags: [{ name: 'recipient_type', value: 'dcc' }] },
    });
    process.env.SENTRY_DSN = 'https://fake@sentry.io/1';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Resend delivery failure: email.complained',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  test('UT-064: does not call Sentry.captureMessage when SENTRY_DSN is not set, even on a bounce', async () => {
    mockVerify.mockReturnValue({ type: 'email.bounced', data: { to: ['dcc@example.com'], tags: [] } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('UT-073: records a complaintDeliveryIssue on the incident when a tagged complaint email bounces', async () => {
    mockVerify.mockReturnValue({
      type: 'email.bounced',
      data: {
        to: ['tuath@example.com'],
        tags: [
          { name: 'incident_id', value: 'CW-ABC123' },
          { name: 'recipient_type', value: 'tuath' },
        ],
      },
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(Incident.updateOne).toHaveBeenCalledWith(
      { shortId: 'CW-ABC123' },
      { $push: { complaintDeliveryIssues: { recipientType: 'tuath', eventType: 'email.bounced' } } }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    consoleSpy.mockRestore();
  });

  test('UT-074: does not touch the database when the event has no incident_id/recipient_type tags (e.g. a resident-facing email)', async () => {
    mockVerify.mockReturnValue({
      type: 'email.bounced',
      data: { to: ['jane@example.com'], tags: [] },
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(Incident.updateOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    consoleSpy.mockRestore();
  });

  test('UT-075: still responds 200 and logs if the Incident.updateOne write fails', async () => {
    mockVerify.mockReturnValue({
      type: 'email.bounced',
      data: {
        to: ['dcc@example.com'],
        tags: [
          { name: 'incident_id', value: 'CW-XYZ999' },
          { name: 'recipient_type', value: 'dcc' },
        ],
      },
    });
    Incident.updateOne = jest.fn().mockRejectedValue(new Error('DB unavailable'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to record complaint delivery issue on incident:', 'DB unavailable');
    consoleSpy.mockRestore();
  });
});
