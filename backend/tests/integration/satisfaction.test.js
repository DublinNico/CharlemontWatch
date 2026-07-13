const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const SatisfactionVote = require('../../models/SatisfactionVote');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await SatisfactionVote.deleteMany({});
});

// ─── POST /api/satisfaction ────────────────────────────────────────────────────

describe('POST /api/satisfaction', () => {
  test('IT-024: valid email and rating returns 200 and persists the vote', async () => {
    const res = await request(app)
      .post('/api/satisfaction')
      .send({ email: 'jane@example.com', rating: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const saved = await SatisfactionVote.findOne({ email: 'jane@example.com' });
    expect(saved.rating).toBe('high');
  });

  test('IT-025: missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/satisfaction')
      .send({ rating: 'high' });
    expect(res.status).toBe(400);
  });

  test('IT-026: invalid email format returns 400', async () => {
    const res = await request(app)
      .post('/api/satisfaction')
      .send({ email: 'notanemail', rating: 'high' });
    expect(res.status).toBe(400);
  });

  test('IT-027: invalid rating returns 400', async () => {
    const res = await request(app)
      .post('/api/satisfaction')
      .send({ email: 'jane@example.com', rating: 'extreme' });
    expect(res.status).toBe(400);
  });

  test('IT-028: voting twice with the same email updates the existing vote rather than creating a duplicate', async () => {
    await request(app).post('/api/satisfaction').send({ email: 'jane@example.com', rating: 'low' });
    const res = await request(app).post('/api/satisfaction').send({ email: 'jane@example.com', rating: 'high' });

    expect(res.status).toBe(200);
    const votes = await SatisfactionVote.find({ email: 'jane@example.com' });
    expect(votes).toHaveLength(1);
    expect(votes[0].rating).toBe('high');
  });

  test('IT-029: email is case-insensitive when upserting', async () => {
    await request(app).post('/api/satisfaction').send({ email: 'Jane@Example.com', rating: 'low' });
    const res = await request(app).post('/api/satisfaction').send({ email: 'jane@example.com', rating: 'medium' });

    expect(res.status).toBe(200);
    const votes = await SatisfactionVote.find({});
    expect(votes).toHaveLength(1);
    expect(votes[0].rating).toBe('medium');
  });
});

// ─── GET /api/satisfaction/summary ─────────────────────────────────────────────

describe('GET /api/satisfaction/summary', () => {
  test('IT-030: returns zero counts when no votes exist', async () => {
    const res = await request(app).get('/api/satisfaction/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ low: 0, medium: 0, high: 0, total: 0 });
  });

  test('IT-031: returns accurate counts per rating without exposing emails', async () => {
    await SatisfactionVote.create([
      { email: 'a@test.com', rating: 'low' },
      { email: 'b@test.com', rating: 'high' },
      { email: 'c@test.com', rating: 'high' },
    ]);

    const res = await request(app).get('/api/satisfaction/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ low: 1, medium: 0, high: 2, total: 3 });
    expect(res.body).not.toHaveProperty('email');
  });
});
