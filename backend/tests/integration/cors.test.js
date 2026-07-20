const request = require('supertest');

// Re-requires app.js fresh with a given CORS_ALLOWED_ORIGINS value, since
// the allow-list is computed once at module load time from process.env.
const loadAppWith = (corsAllowedOrigins) => {
  jest.resetModules();
  process.env.CORS_ALLOWED_ORIGINS = corsAllowedOrigins;
  return require('../../app');
};

describe('CORS www/non-www equivalence', () => {
  afterEach(() => {
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  test('IT-052-A: configuring only the apex origin also allows its www counterpart', async () => {
    const app = loadAppWith('https://charlemontwatch.ie');

    const apex = await request(app).get('/api/health').set('Origin', 'https://charlemontwatch.ie');
    expect(apex.headers['access-control-allow-origin']).toBe('https://charlemontwatch.ie');

    const www = await request(app).get('/api/health').set('Origin', 'https://www.charlemontwatch.ie');
    expect(www.status).not.toBe(403);
    expect(www.headers['access-control-allow-origin']).toBe('https://www.charlemontwatch.ie');
  });

  test('IT-052-B: configuring only the www origin also allows the apex counterpart', async () => {
    const app = loadAppWith('https://www.charlemontwatch.ie');

    const www = await request(app).get('/api/health').set('Origin', 'https://www.charlemontwatch.ie');
    expect(www.headers['access-control-allow-origin']).toBe('https://www.charlemontwatch.ie');

    const apex = await request(app).get('/api/health').set('Origin', 'https://charlemontwatch.ie');
    expect(apex.status).not.toBe(403);
    expect(apex.headers['access-control-allow-origin']).toBe('https://charlemontwatch.ie');
  });

  test('IT-052-C: an unrelated origin is still rejected', async () => {
    const app = loadAppWith('https://charlemontwatch.ie');

    const res = await request(app).get('/api/health').set('Origin', 'https://evil-site.example.com');
    expect(res.status).toBe(403);
  });
});
