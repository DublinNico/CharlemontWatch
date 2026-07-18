const mockVerify = jest.fn();

jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({ verify: mockVerify })),
}));

jest.mock('@sentry/node', () => ({ captureMessage: jest.fn() }));
const Sentry = require('@sentry/node');

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
});

describe('handleResendWebhook', () => {
  test('returns 500 and skips verification when RESEND_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  test('returns 401 when signature verification fails', async () => {
    mockVerify.mockImplementation(() => { throw new Error('bad signature'); });
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 200 for a non-failure event type and does not report to Sentry', async () => {
    mockVerify.mockReturnValue({ type: 'email.delivered', data: { to: ['tuath@example.com'], tags: [] } });
    process.env.SENTRY_DSN = 'https://fake@sentry.io/1';
    const res = makeRes();
    await handleResendWebhook(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  test('logs and reports to Sentry on a bounce event, extracting incident/recipient tags', async () => {
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

  test('treats email.complained and email.delivery_delayed as delivery failures too', async () => {
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

  test('does not call Sentry.captureMessage when SENTRY_DSN is not set, even on a bounce', async () => {
    mockVerify.mockReturnValue({ type: 'email.bounced', data: { to: ['dcc@example.com'], tags: [] } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await handleResendWebhook(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
