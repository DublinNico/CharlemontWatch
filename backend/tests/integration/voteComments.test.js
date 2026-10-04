const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const VoteComment = require('../../models/VoteComment');

let mongod;
let adminToken;
let userToken;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  adminToken = jwt.sign({ _id: new mongoose.Types.ObjectId(), role: 'admin' }, process.env.JWT_SECRET);
  userToken = jwt.sign({ _id: new mongoose.Types.ObjectId(), role: 'user' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await VoteComment.deleteMany({});
});

const valid = { name: 'Jane', email: 'jane@example.com', text: 'The stairwell lights have been out for weeks.' };

// ─── POST /api/satisfaction/comments ──────────────────────────────────────────

describe('POST /api/satisfaction/comments', () => {
  test('saves a valid comment as pending', async () => {
    const res = await request(app).post('/api/satisfaction/comments').send(valid);
    expect(res.status).toBe(201);
    const saved = await VoteComment.findOne({ email: 'jane@example.com' });
    expect(saved.status).toBe('pending');
    expect(saved.text).toBe(valid.text);
  });

  test('a blank name is saved as "A resident"', async () => {
    const res = await request(app).post('/api/satisfaction/comments').send({ ...valid, name: '  ' });
    expect(res.status).toBe(201);
    const saved = await VoteComment.findOne({ email: 'jane@example.com' });
    expect(saved.name).toBe('A resident');
  });

  test('rejects a name over 50 characters', async () => {
    const res = await request(app).post('/api/satisfaction/comments').send({ ...valid, name: 'a'.repeat(51) });
    expect(res.status).toBe(400);
  });

  test.each([
    ['email', { ...valid, email: 'notanemail' }],
    ['comment', { ...valid, text: '' }],
  ])('rejects a missing or invalid %s with 400', async (_field, body) => {
    const res = await request(app).post('/api/satisfaction/comments').send(body);
    expect(res.status).toBe(400);
    expect(await VoteComment.countDocuments()).toBe(0);
  });

  test('rejects a comment over 1000 characters', async () => {
    const res = await request(app).post('/api/satisfaction/comments').send({ ...valid, text: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });

  test('honeypot submissions get a fake success and are not saved', async () => {
    const res = await request(app).post('/api/satisfaction/comments').send({ ...valid, website: 'spam.example' });
    expect(res.status).toBe(201);
    expect(await VoteComment.countDocuments()).toBe(0);
  });
});

// ─── GET /api/satisfaction/comments ───────────────────────────────────────────

describe('GET /api/satisfaction/comments', () => {
  test('returns only approved comments, without emails', async () => {
    await VoteComment.create({ ...valid, status: 'approved' });
    await VoteComment.create({ ...valid, text: 'Still waiting', status: 'pending' });

    const res = await request(app).get('/api/satisfaction/comments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe(valid.text);
    expect(res.body[0].email).toBeUndefined();
  });
});

// ─── Admin moderation ─────────────────────────────────────────────────────────

describe('admin comment moderation', () => {
  test('listing all comments requires an admin token', async () => {
    expect((await request(app).get('/api/satisfaction/comments/admin')).status).toBe(401);
    const res = await request(app).get('/api/satisfaction/comments/admin').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('admin sees pending comments first, with emails', async () => {
    await VoteComment.create({ ...valid, status: 'approved' });
    await VoteComment.create({ ...valid, text: 'Pending one' });

    const res = await request(app).get('/api/satisfaction/comments/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe('pending');
    expect(res.body[0].email).toBe('jane@example.com');
  });

  test('approving makes a comment public', async () => {
    const comment = await VoteComment.create(valid);
    const res = await request(app)
      .patch(`/api/satisfaction/comments/admin/${comment._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const publicRes = await request(app).get('/api/satisfaction/comments');
    expect(publicRes.body).toHaveLength(1);
  });

  test('deleting removes a comment', async () => {
    const comment = await VoteComment.create(valid);
    const res = await request(app)
      .delete(`/api/satisfaction/comments/admin/${comment._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(await VoteComment.countDocuments()).toBe(0);
  });

  test('approve and delete return 404 for unknown or malformed ids', async () => {
    const missing = new mongoose.Types.ObjectId();
    const auth = { Authorization: `Bearer ${adminToken}` };
    expect((await request(app).patch(`/api/satisfaction/comments/admin/${missing}/approve`).set(auth)).status).toBe(404);
    expect((await request(app).delete('/api/satisfaction/comments/admin/not-an-id').set(auth)).status).toBe(404);
  });
});

// ─── Commenter deletes via emailed link ───────────────────────────────────────

describe('delete via private link', () => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const deleteTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  test('new comments get a stored token hash that admins never see', async () => {
    await request(app).post('/api/satisfaction/comments').send(valid);
    const saved = await VoteComment.findOne({ email: 'jane@example.com' }).select('+deleteTokenHash');
    expect(saved.deleteTokenHash).toMatch(/^[a-f0-9]{64}$/);

    const res = await request(app).get('/api/satisfaction/comments/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(res.body[0].deleteTokenHash).toBeUndefined();
  });

  test('the link shows the commenter their comment', async () => {
    await VoteComment.create({ ...valid, deleteTokenHash });
    const res = await request(app).post('/api/satisfaction/comments/mine').send({ token });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe(valid.text);
    expect(res.body.email).toBeUndefined();
  });

  test('the link deletes the comment, pending or approved', async () => {
    await VoteComment.create({ ...valid, status: 'approved', deleteTokenHash });
    const res = await request(app).post('/api/satisfaction/comments/mine/delete').send({ token });
    expect(res.status).toBe(200);
    expect(await VoteComment.countDocuments()).toBe(0);
  });

  test('a wrong, malformed or reused token returns 404 and deletes nothing', async () => {
    await VoteComment.create({ ...valid, deleteTokenHash });
    const wrong = crypto.randomBytes(32).toString('hex');
    expect((await request(app).post('/api/satisfaction/comments/mine/delete').send({ token: wrong })).status).toBe(404);
    expect((await request(app).post('/api/satisfaction/comments/mine/delete').send({ token: 'abc' })).status).toBe(404);
    expect((await request(app).post('/api/satisfaction/comments/mine/delete').send({ token: { $ne: null } })).status).toBe(404);
    expect(await VoteComment.countDocuments()).toBe(1);

    await request(app).post('/api/satisfaction/comments/mine/delete').send({ token });
    expect((await request(app).post('/api/satisfaction/comments/mine').send({ token })).status).toBe(404);
  });
});
