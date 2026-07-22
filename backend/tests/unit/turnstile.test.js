const { verifyTurnstile } = require('../../utils/turnstile');

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.TURNSTILE_SECRET_KEY = originalSecret;
  jest.restoreAllMocks();
});

test('UT-TS-A: always passes in the test environment, even with a configured secret', async () => {
  process.env.NODE_ENV = 'test';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  await expect(verifyTurnstile(undefined, '1.2.3.4')).resolves.toBe(true);
});

test('UT-TS-B: bypasses the check outside production when no secret is configured', async () => {
  process.env.NODE_ENV = 'development';
  delete process.env.TURNSTILE_SECRET_KEY;
  await expect(verifyTurnstile('some-token', '1.2.3.4')).resolves.toBe(true);
});

test('UT-TS-C: fails closed in production when no secret is configured', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.TURNSTILE_SECRET_KEY;
  await expect(verifyTurnstile('some-token', '1.2.3.4')).resolves.toBe(false);
});

test('UT-TS-D: rejects when no token is provided', async () => {
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  await expect(verifyTurnstile(undefined, '1.2.3.4')).resolves.toBe(false);
});

test('UT-TS-E: returns true when Cloudflare reports success', async () => {
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => ({ success: true }),
  });

  await expect(verifyTurnstile('good-token', '1.2.3.4')).resolves.toBe(true);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  expect(options.body.toString()).toContain('response=good-token');
  expect(options.body.toString()).toContain('remoteip=1.2.3.4');
});

test('UT-TS-F: returns false when Cloudflare reports failure', async () => {
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => ({ success: false }),
  });

  await expect(verifyTurnstile('bad-token', '1.2.3.4')).resolves.toBe(false);
});

test('UT-TS-G: returns "unavailable" when the verification request fails (network/timeout)', async () => {
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

  await expect(verifyTurnstile('some-token', '1.2.3.4')).resolves.toBe('unavailable');
});
