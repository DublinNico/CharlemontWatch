/**
 * Security tests — ST-003 through ST-006
 * ST-001 (JWT tampering) and ST-002 (wrong secret) are covered by UT-007-A/B.
 * ST-007 (resident cannot update status) is covered by IT-015.
 */

jest.mock('@sendgrid/mail', () => ({ setApiKey: jest.fn(), send: jest.fn().mockResolvedValue([{ statusCode: 202 }]) }));
jest.mock('../../config/s3', () => ({
  upload: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
}));

process.env.JWT_SECRET = 'charlemont-test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'eu-north-1';
process.env.FRONTEND_URL = 'http://localhost:3000';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = require('../../app');
const Incident = require('../../models/Incident');
const User = require('../../models/User');

let mongod;

const residentToken = jwt.sign(
  { _id: new mongoose.Types.ObjectId(), email: 'res@test.com', role: 'resident' },
  'charlemont-test-secret-key',
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { _id: new mongoose.Types.ObjectId(), email: 'admin@test.com', role: 'admin' },
  'charlemont-test-secret-key',
  { expiresIn: '1h' }
);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Incident.deleteMany({});
  await User.deleteMany({});
});

// ─── ST-003: NoSQL injection ──────────────────────────────────────────────────

describe('ST-003: NoSQL injection on /api/auth/login', () => {
  test('operator payload in email field is rejected — does not bypass auth', async () => {
    // Without express-mongo-sanitize this could bypass auth in apps without type guards.
    // Our type guard rejects non-string email values (returns 400).
    // express-mongo-sanitize strips $ keys as a further defence-in-depth layer.
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'anything' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('operator payload in password field is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: { $gt: '' } });

    expect(res.status).toBe(400);
  });
});

// ─── ST-004: XSS — description stored as plain text ─────────────────────────

describe('ST-004: XSS in incident description is stored as plain text', () => {
  test('script tag in description is stored verbatim, not executed', async () => {
    const xssPayload = '<script>alert(1)</script>';

    const res = await request(app)
      .post('/api/incidents/report')
      .send({
        incidentType: 'graffiti',
        location: 'Block A',
        description: xssPayload,
      });

    expect(res.status).toBe(201);
    const incident = await Incident.findOne({ shortId: res.body.incidentId });
    // Stored verbatim — escaping is React's responsibility at render time
    expect(incident.description).toBe(xssPayload);
    // Ensure no HTML was interpreted or transformed server-side
    expect(incident.description).not.toContain('&lt;');
  });
});

// ─── ST-005: Brute-force — rate limiter blocks after threshold ────────────────

describe('ST-005: brute-force login protection', () => {
  test('rate limiter returns 429 after exceeding the request threshold', async () => {
    // Build a mini app with a tight limit (max 3) to test the limiter in isolation.
    // The real app skips the limiter in NODE_ENV=test so existing auth tests are unaffected.
    const miniApp = express();
    miniApp.use(express.json());
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      standardHeaders: false,
      legacyHeaders: false,
      message: { error: 'Too many login attempts, please try again later' },
    });
    miniApp.post('/api/auth/login', limiter, (req, res) =>
      res.status(401).json({ error: 'Invalid credentials' })
    );

    // First 3 requests pass through (still 401 — wrong credentials)
    for (let i = 0; i < 3; i++) {
      const r = await request(miniApp)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong' });
      expect(r.status).toBe(401);
    }

    // 4th request is rate limited
    const blocked = await request(miniApp)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many login attempts/i);
  });
});

// ─── ST-006: Resident JWT cannot delete an incident ──────────────────────────

describe('ST-006: resident JWT is forbidden from deleting incidents', () => {
  test('DELETE /api/incidents/admin/:id with resident JWT returns 403', async () => {
    const incident = await Incident.create({
      shortId: 'CW-SEC001',
      incidentType: 'graffiti',
      location: 'Block A',
      description: 'Test',
      status: 'NEW',
    });

    const res = await request(app)
      .delete(`/api/incidents/admin/${incident.shortId}`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(403);

    // Verify the incident was NOT deleted
    const still = await Incident.findOne({ shortId: 'CW-SEC001' });
    expect(still).not.toBeNull();
  });
});
