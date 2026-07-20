// Named with a "mock" prefix so Jest's module-hoisting allows referencing it
// inside the jest.mock() factory below — gives every test file-wide access
// to the same send mock via a stable reference, rather than digging through
// Resend.mock.results.
const mockResendSend = jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockResendSend } })) }));
jest.mock('../../config/s3', () => ({
  upload: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ Location: 'https://s3.example.com/test.jpg' }),
  }),
}));
// The JPEG_BUFFER fixture isn't a real decodable image, so sharp is mocked —
// compression itself is exercised manually, not through these fixtures.
jest.mock('sharp', () => jest.fn(() => ({
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-jpeg-bytes')),
})));

process.env.JWT_SECRET = 'charlemont-test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'eu-north-1';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-key';
process.env.ADMIN_EMAIL = 'admin@charlemontwatch.ie';
process.env.TUATH_COMPLAINT_EMAIL = 'tuath@example.com';
process.env.DCC_COMPLAINT_EMAIL = 'dcc@example.com';

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

// Anonymous-capable: only reporterEmail is required. complainantName/complainantAddress
// are only needed when sendComplaintTo is set (see the reporter identity describe block below).
const validBody = {
  incidentType: 'graffiti',
  location: 'Block A, Charlemont Street',
  description: 'Graffiti on south wall',
  reporterEmail: 'jane@example.com',
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

  test('IT-002: missing required field (location) returns 400', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ incidentType: 'graffiti', description: 'Test' });
    expect(res.status).toBe(400);
  });

  test('IT-003: invalid incidentType returns 400', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ ...validBody, incidentType: 'vandalism' });
    expect(res.status).toBe(400);
  });

  test('IT-004: photo attachment stores photo URL in the incident', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .field('incidentType', 'graffiti')
      .field('location', 'Block A')
      .field('description', 'Test with photo')
      .field('reporterEmail', 'jane@example.com')
      .attach('photos', JPEG_BUFFER, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    const incident = await Incident.findOne({ shortId: res.body.incidentId });
    expect(incident.photos).toHaveLength(1);
    expect(incident.photos[0].url).toContain('amazonaws.com');
  });

  test('IT-032: uploaded photos are compressed to JPEG before being stored', async () => {
    const s3 = require('../../config/s3');
    s3.upload.mockClear();

    const res = await request(app)
      .post('/api/incidents/report')
      .field('incidentType', 'graffiti')
      .field('location', 'Block A')
      .field('description', 'Test with photo')
      .field('reporterEmail', 'jane@example.com')
      .attach('photos', JPEG_BUFFER, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(s3.upload).toHaveBeenCalledTimes(1);
    const uploadParams = s3.upload.mock.calls[0][0];
    expect(uploadParams.ContentType).toBe('image/jpeg');
    expect(uploadParams.Body.toString()).toBe('compressed-jpeg-bytes');
  });

  test('IT-005: 11 photos submitted returns 400', async () => {
    let req = request(app)
      .post('/api/incidents/report')
      .field('incidentType', 'graffiti')
      .field('location', 'Block A')
      .field('description', 'Test')
      .field('reporterEmail', 'jane@example.com');
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

  test('IT-008-A: anonymous caller does not receive reporterEmail', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(i => i.reporterEmail === undefined)).toBe(true);
  });

  test('IT-008-B: admin caller receives reporterEmail', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(i => i.reporterEmail === validBody.reporterEmail)).toBe(true);
  });

  test('IT-008-C: anonymous caller only receives approved photos', async () => {
    await Incident.create({
      ...validBody,
      shortId: 'CW-PHOTOS',
      status: 'NEW',
      photos: [
        { url: 'https://s3.example.com/approved.jpg', approved: true },
        { url: 'https://s3.example.com/unapproved.jpg', approved: false },
      ],
    });
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    const withPhotos = res.body.find(i => i.shortId === 'CW-PHOTOS');
    expect(withPhotos.photos).toHaveLength(1);
    expect(withPhotos.photos[0].url).toBe('https://s3.example.com/approved.jpg');
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

  test('IT-011-D: ACTIVE incident strips PII and unapproved photos for an anonymous caller', async () => {
    await Incident.create({
      ...validBody,
      shortId: 'CW-ACTIVE',
      status: 'NEW',
      complainantName: 'Jane Doe',
      complainantAddress: '1 Charlemont Street',
      photos: [
        { url: 'https://s3.example.com/approved.jpg', approved: true },
        { url: 'https://s3.example.com/unapproved.jpg', approved: false },
      ],
    });
    const res = await request(app).get('/api/incidents/CW-ACTIVE');
    expect(res.status).toBe(200);
    expect(res.body.reporterEmail).toBeUndefined();
    expect(res.body.complainantName).toBeUndefined();
    expect(res.body.complainantAddress).toBeUndefined();
    expect(res.body.photos).toHaveLength(1);
    expect(res.body.photos[0].url).toBe('https://s3.example.com/approved.jpg');
  });

  test('IT-011-A: PENDING_REVIEW incident strips PII for an anonymous caller', async () => {
    await Incident.create({
      ...validBody,
      shortId: 'CW-PENDNG',
      status: 'PENDING_REVIEW',
      complainantName: 'Jane Doe',
      complainantAddress: '1 Charlemont Street',
      photos: [
        { url: 'https://s3.example.com/approved.jpg', approved: true },
        { url: 'https://s3.example.com/unapproved.jpg', approved: false },
      ],
    });
    const res = await request(app).get('/api/incidents/CW-PENDNG');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_REVIEW');
    expect(res.body.location).toBe(validBody.location);
    expect(res.body.reporterEmail).toBeUndefined();
    expect(res.body.complainantName).toBeUndefined();
    expect(res.body.complainantAddress).toBeUndefined();
    expect(res.body.photos).toHaveLength(1);
    expect(res.body.photos[0].url).toBe('https://s3.example.com/approved.jpg');
  });

  test('IT-011-B: REJECTED incident strips PII for an anonymous caller', async () => {
    await Incident.create({ ...validBody, shortId: 'CW-REJECT', status: 'REJECTED' });
    const res = await request(app).get('/api/incidents/CW-REJECT');
    expect(res.status).toBe(200);
    expect(res.body.reporterEmail).toBeUndefined();
  });

  test('IT-011-C: PENDING_REVIEW incident returns full PII for an admin caller', async () => {
    await Incident.create({ ...validBody, shortId: 'CW-ADMPND', status: 'PENDING_REVIEW' });
    const res = await request(app)
      .get('/api/incidents/CW-ADMPND')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.reporterEmail).toBe(validBody.reporterEmail);
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

// ─── PATCH /api/incidents/admin/:id/review ─────────────────────────────────────

describe('PATCH /api/incidents/admin/:id/review', () => {
  let incident;

  beforeEach(async () => {
    incident = await Incident.create({ ...validBody, shortId: 'CW-REVIEW1', status: 'PENDING_REVIEW' });
  });

  test('IT-034: admin JWT approves a pending incident, moving it to NEW', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('NEW');
  });

  test('IT-034-A: approving marks all of the incident\'s photos approved', async () => {
    incident.photos = [
      { url: 'https://s3.example.com/one.jpg', approved: false },
      { url: 'https://s3.example.com/two.jpg', approved: false },
    ];
    await incident.save();
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.incident.photos.every(p => p.approved)).toBe(true);
  });

  test('IT-035: admin JWT rejects a pending incident, moving it to REJECTED', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject' });
    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('REJECTED');
  });

  test('IT-036: no JWT returns 401', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .send({ action: 'approve' });
    expect(res.status).toBe(401);
  });

  test('IT-037: resident JWT returns 403', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(403);
  });

  test('IT-038: invalid action returns 400', async () => {
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'delete' });
    expect(res.status).toBe(400);
  });

  test('IT-039: unknown incident id returns 404', async () => {
    const res = await request(app)
      .patch('/api/incidents/admin/CW-UNKNOWN/review')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(404);
  });

  test('IT-040: an already-reviewed incident returns 409', async () => {
    incident.status = 'NEW';
    await incident.save();
    const res = await request(app)
      .patch(`/api/incidents/admin/${incident.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(409);
  });
});

// ─── Formal complaint dispatch is gated on admin approval ──────────────────────

describe('Formal complaint emails are only sent on admin approval', () => {
  const findComplaintCall = (to) =>
    mockResendSend.mock.calls.find(call => call[0].to?.includes(to));

  test('IT-041: submitting a report with a complaint request does NOT send the complaint immediately', async () => {
    mockResendSend.mockClear();
    const res = await request(app)
      .post('/api/incidents/report')
      .send({
        ...validBody,
        sendComplaintTo: 'tuath',
        complainantName: 'Jane Resident',
        complainantAddress: 'Apt 12, Charlemont Street, Dublin 2',
      });
    expect(res.status).toBe(201);
    // Resident confirmation + admin notification still fire — just not the complaint
    expect(findComplaintCall('tuath@example.com')).toBeUndefined();
  });

  test('IT-042: approving an incident with a pending complaint sends it to the requested org(s)', async () => {
    const pending = await Incident.create({
      ...validBody,
      shortId: 'CW-COMPLAINT1',
      status: 'PENDING_REVIEW',
      complainantName: 'Jane Resident',
      complainantAddress: 'Apt 12, Charlemont Street, Dublin 2',
      sendComplaintTo: ['tuath', 'dcc'],
    });
    mockResendSend.mockClear();

    const res = await request(app)
      .patch(`/api/incidents/admin/${pending.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);

    expect(findComplaintCall('tuath@example.com')).toBeDefined();
    expect(findComplaintCall('dcc@example.com')).toBeDefined();
  });

  test('IT-043: approving an incident with no complaint requested sends no complaint email', async () => {
    const pending = await Incident.create({ ...validBody, shortId: 'CW-NOCOMPLAINT', status: 'PENDING_REVIEW' });
    mockResendSend.mockClear();

    await request(app)
      .patch(`/api/incidents/admin/${pending.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    expect(findComplaintCall('tuath@example.com')).toBeUndefined();
    expect(findComplaintCall('dcc@example.com')).toBeUndefined();
  });

  test('IT-044: rejecting an incident with a pending complaint never sends it', async () => {
    const pending = await Incident.create({
      ...validBody,
      shortId: 'CW-COMPLAINT2',
      status: 'PENDING_REVIEW',
      complainantName: 'Jane Resident',
      complainantAddress: 'Apt 12, Charlemont Street, Dublin 2',
      sendComplaintTo: ['tuath'],
    });
    mockResendSend.mockClear();

    await request(app)
      .patch(`/api/incidents/admin/${pending.shortId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject' });

    expect(findComplaintCall('tuath@example.com')).toBeUndefined();
  });
});

// ─── reporter identity validation ─────────────────────────────────────────────
// reporterEmail is always required (verifies the reporter lives in the complex).
// complainantName/complainantAddress are only required when sendComplaintTo is set —
// anonymous reporting (no name, no address, no complaint) must still work.

describe('POST /api/incidents/report — reporter identity validation', () => {
  beforeEach(async () => { await Incident.deleteMany({}); });

  test('IT-022-A: missing reporterEmail returns 400', async () => {
    const { reporterEmail, ...body } = validBody;
    const res = await request(app).post('/api/incidents/report').send(body);
    expect(res.status).toBe(400);
  });

  test('IT-022-B: invalid reporterEmail format returns 400', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ ...validBody, reporterEmail: 'notanemail' });
    expect(res.status).toBe(400);
  });

  test('IT-022-C: anonymous report (email only, no name/address, no complaint) returns 201', async () => {
    const res = await request(app).post('/api/incidents/report').send(validBody);
    expect(res.status).toBe(201);
    const saved = await Incident.findOne({ shortId: res.body.incidentId });
    expect(saved.reporterEmail).toBe('jane@example.com');
    expect(saved.complainantName).toBeUndefined();
    expect(saved.complainantAddress).toBeUndefined();
    expect(saved.sendComplaintTo).toHaveLength(0);
  });

  test('IT-022-D: sendComplaintTo set without complainantName returns 400', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ ...validBody, sendComplaintTo: 'tuath', complainantAddress: 'Apt 12, Charlemont Street, Dublin 2' });
    expect(res.status).toBe(400);
  });

  test('IT-022-E: sendComplaintTo set without complainantAddress returns 400', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({ ...validBody, sendComplaintTo: 'tuath', complainantName: 'Jane Resident' });
    expect(res.status).toBe(400);
  });

  test('IT-023: sendComplaintTo with name and address persists complaint fields', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({
        ...validBody,
        sendComplaintTo: 'tuath',
        complainantName: 'Jane Resident',
        complainantAddress: 'Apt 12, Charlemont Street, Dublin 2',
      });

    expect(res.status).toBe(201);
    const saved = await Incident.findOne({ shortId: res.body.incidentId });
    expect(saved.complainantName).toBe('Jane Resident');
    expect(saved.complainantAddress).toBe('Apt 12, Charlemont Street, Dublin 2');
    expect(saved.reporterEmail).toBe('jane@example.com');
    expect(saved.sendComplaintTo).toContain('tuath');
  });

  test('IT-033: sendComplaintTo with a space after the comma retains both recipients', async () => {
    const res = await request(app)
      .post('/api/incidents/report')
      .send({
        ...validBody,
        sendComplaintTo: 'tuath, dcc',
        complainantName: 'Jane Resident',
        complainantAddress: 'Apt 12, Charlemont Street, Dublin 2',
      });

    expect(res.status).toBe(201);
    const saved = await Incident.findOne({ shortId: res.body.incidentId });
    expect(saved.sendComplaintTo).toEqual(expect.arrayContaining(['tuath', 'dcc']));
    expect(saved.sendComplaintTo).toHaveLength(2);
  });
});
