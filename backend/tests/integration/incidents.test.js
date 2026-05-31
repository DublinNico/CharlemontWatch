jest.mock('@sendgrid/mail', () => ({ setApiKey: jest.fn(), send: jest.fn().mockResolvedValue([{ statusCode: 202 }]) }));
jest.mock('../../config/s3', () => ({
  upload: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ Location: 'https://s3.example.com/test.jpg' }),
  }),
}));

process.env.JWT_SECRET = 'charlemont-test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'eu-north-1';
process.env.FRONTEND_URL = 'http://localhost:3000';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Incident = require('../../models/Incident');

const JPEG_BUFFER = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(20).fill(0x00)]);

const adminToken = jwt.sign(
  { _id: new mongoose.Types.ObjectId(), email: 'admin@test.com', role: 'admin' },
  'charlemont-test-secret-key',
  { expiresIn: '1h' }
);
const residentToken = jwt.sign(
  { _id: new mongoose.Types.ObjectId(), email: 'res@test.com', role: 'resident' },
  'charlemont-test-secret-key',
  { expiresIn: '1h' }
);

const validBody = {
  incidentType: 'graffiti',
  location: 'Block A, Charlemont Street',
  description: 'Graffiti on south wall',
};

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
  await Incident.deleteMany({});
});

// ─── POST /api/incidents/report ───────────────────────────────────────────────

describe('POST /api/incidents/report', () => {
  test('IT-001: valid body returns 201 with a shortId', async () => {
    const res = await request(app).post('/api/incidents/report').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.incidentId).toMatch(/^CW-/);
  });

  test('IT-002: missing required field (location) returns 500', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ incidentType: 'graffiti', description: 'Test' });
    expect(res.status).toBe(500);
  });

  test('IT-003: invalid incidentType returns 500', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ ...validBody, incidentType: 'vandalism' });
    expect(res.status).toBe(500);
  });

  test('IT-004: photo attachment stores photo URL in the incident', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .field('incidentType', 'graffiti')
      .field('location', 'Block A')
      .field('description', 'Test with photo')
      .attach('photos', JPEG_BUFFER, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    const incident = await Incident.findOne({ shortId: res.body.incidentId });
    expect(incident.photos).toHaveLength(1);
    expect(incident.photos[0].url).toContain('amazonaws.com');
  });

  test('IT-005: 11 photos submitted returns 400', async () => {
    let req = request(app).post('/api/incidents/report');
    for (let i = 0; i < 11; i++) {
      req = req.attach('photos', JPEG_BUFFER, { filename: `photo${i}.jpg`, contentType: 'image/jpeg' });
    }
    const res = await req;
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/incidents ───────────────────────────────────────────────────────

describe('GET /api/incidents', () => {
  beforeEach(async () => {
    await Incident.create([
      { ...validBody, shortId: 'CW-000001', status: 'NEW' },
      { ...validBody, shortId: 'CW-000002', status: 'IN_PROGRESS' },
      { ...validBody, shortId: 'CW-000003', incidentType: 'antisocial', status: 'NEW' },
      { ...validBody, shortId: 'CW-000004', status: 'PENDING_REVIEW' },
      { ...validBody, shortId: 'CW-000005', status: 'REJECTED' },
    ]);
  });

  test('IT-006: returns only active incidents (PENDING_REVIEW and REJECTED excluded)', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    const statuses = res.body.map(i => i.status);
    expect(statuses).not.toContain('PENDING_REVIEW');
    expect(statuses).not.toContain('REJECTED');
  });

  test('IT-007: ?status=NEW returns only NEW incidents', async () => {
    const res = await request(app).get('/api/incidents?status=NEW');
    expect(res.status).toBe(200);
    expect(res.body.every(i => i.status === 'NEW')).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  test('IT-008: ?type=graffiti returns only graffiti incidents', async () => {
    const res = await request(app).get('/api/incidents?type=graffiti');
    expect(res.status).toBe(200);
    expect(res.body.every(i => i.incidentType === 'graffiti')).toBe(true);
  });
});

// ─── GET /api/incidents/:id ───────────────────────────────────────────────────

describe('GET /api/incidents/:id', () => {
  let incident;

  beforeEach(async () => {
    incident = await Incident.create({ ...validBody, shortId: 'CW-ABCDEF', status: 'NEW' });
  });

  test('IT-009: valid shortId returns the incident', async () => {
    const res = await request(app).get('/api/incidents/CW-ABCDEF');
    expect(res.status).toBe(200);
    expect(res.body.shortId).toBe('CW-ABCDEF');
  });

  test('IT-010: valid MongoDB ObjectId returns the incident', async () => {
    const res = await request(app).get(`/api/incidents/${incident._id}`);
    expect(res.status).toBe(200);
    expect(res.body.shortId).toBe('CW-ABCDEF');
  });

  test('IT-011: unknown ID returns 404', async () => {
    const res = await request(app).get('/api/incidents/CW-UNKNOWN');
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/incidents/admin/:id/status ────────────────────────────────────

describe('PATCH /api/incidents/admin/:id/status', () => {
  let incident;

  beforeEach(async () => {
    incident = await Incident.create({ ...validBody, shortId: 'CW-STATUS1', status: 'NEW' });
  });

  test('IT-012: valid status + admin JWT returns 200 and updated incident', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('IN_PROGRESS');
  });

  test('IT-013: invalid status returns 400', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PENDING' });
    expect(res.status).toBe(400);
  });

  test('IT-014: no JWT returns 401', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(401);
  });

  test('IT-015: resident JWT returns 403', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/status`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/incidents/admin/:id ─────────────────────────────────────────

describe('DELETE /api/incidents/admin/:id', () => {
  let incident;

  beforeEach(async () => {
    incident = await Incident.create({ ...validBody, shortId: 'CW-DELETE1', status: 'NEW' });
  });

  test('IT-016: admin JWT deletes the incident and returns 200', async () => {
    const res = await request(app)
      .delete(`/api/incidents/admin/${incident.shortId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const gone = await Incident.findOne({ shortId: 'CW-DELETE1' });
    expect(gone).toBeNull();
  });

  test('IT-017: no JWT returns 401', async () => {
    const res = await request(app)
      .delete(`/api/incidents/admin/${incident.shortId}`);
    expect(res.status).toBe(401);
  });
});
