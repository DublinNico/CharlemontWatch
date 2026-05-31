jest.mock('@sendgrid/mail', () => ({ setApiKey: jest.fn(), send: jest.fn().mockResolvedValue([{ statusCode: 202 }]) }));

process.env.JWT_SECRET = 'charlemont-test-secret-key';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Create a real admin user — pre-save hook hashes the password
  await User.create({ email: 'admin@test.com', password: 'AdminPass123!', role: 'admin' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('IT-018: correct credentials return 200 with a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'AdminPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.role).toBe('admin');
  });

  test('IT-019: wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('IT-020: unknown email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'AdminPass123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('IT-021: register route is removed and returns 404', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'pass' });
    expect(res.status).toBe(404);
  });
});
