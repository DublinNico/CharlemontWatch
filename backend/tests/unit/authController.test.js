process.env.JWT_SECRET = 'charlemont-test-secret-key';

const jwt = require('jsonwebtoken');

jest.mock('../../models/User');
const User = require('../../models/User');

const { login } = require('../../controllers/authController');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const makeReq = (body = {}) => ({ body });

// ─── input validation ─────────────────────────────────────────────────────────

describe('login — input validation', () => {
  test('UT-026-A: returns 400 when email is missing', async () => {
    const res = makeRes();
    await login(makeReq({ password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });

  test('UT-026-B: returns 400 when password is missing', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });

  test('UT-026-C: returns 400 when email is not a string', async () => {
    const res = makeRes();
    await login(makeReq({ email: 123, password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UT-026-D: returns 400 when password is not a string', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: true }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UT-026-E: returns 400 when email is blank whitespace', async () => {
    const res = makeRes();
    await login(makeReq({ email: '   ', password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('UT-026-F: returns 400 when password is blank whitespace', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: '   ' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── credential checks ────────────────────────────────────────────────────────

describe('login — credential checks', () => {
  test('UT-027: returns 401 when user is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const res = makeRes();
    await login(makeReq({ email: 'nobody@test.com', password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  test('UT-028: returns 401 when password does not match', async () => {
    User.findOne.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
      role: 'admin',
    });
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: 'wrongpass' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  test('UT-029: returns 403 when user role is not admin', async () => {
    User.findOne.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(true),
      role: 'resident',
    });
    const res = makeRes();
    await login(makeReq({ email: 'resident@test.com', password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access only' });
  });
});

// ─── successful login ─────────────────────────────────────────────────────────

describe('login — successful admin login', () => {
  const mockUser = {
    _id: 'user123',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    comparePassword: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    User.findOne.mockResolvedValue(mockUser);
  });

  test('UT-030-A: returns success:true with token and user on valid admin login', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: 'correctpass' }), res);
    expect(res.status).not.toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(typeof payload.token).toBe('string');
    expect(payload.user.email).toBe('admin@test.com');
    expect(payload.user.role).toBe('admin');
  });

  test('UT-030-B: token contains correct role and email claims', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: 'correctpass' }), res);
    const { token } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(token, 'charlemont-test-secret-key');
    expect(decoded.email).toBe('admin@test.com');
    expect(decoded.role).toBe('admin');
  });

  test('UT-030-C: password is not included in the response user object', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: 'correctpass' }), res);
    const { user } = res.json.mock.calls[0][0];
    expect(user.password).toBeUndefined();
  });
});

// ─── email normalisation ──────────────────────────────────────────────────────

describe('login — email normalisation', () => {
  test('UT-031-A: lowercases email before DB lookup', async () => {
    User.findOne.mockResolvedValue(null);
    await login(makeReq({ email: 'ADMIN@TEST.COM', password: 'secret' }), makeRes());
    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@test.com' });
  });

  test('UT-031-B: trims whitespace from email before DB lookup', async () => {
    User.findOne.mockResolvedValue(null);
    await login(makeReq({ email: '  admin@test.com  ', password: 'secret' }), makeRes());
    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@test.com' });
  });
});

// ─── server errors ────────────────────────────────────────────────────────────

describe('login — server errors', () => {
  test('UT-032: returns 500 when an unexpected error is thrown', async () => {
    User.findOne.mockRejectedValue(new Error('DB connection lost'));
    const res = makeRes();
    await login(makeReq({ email: 'admin@test.com', password: 'secret' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
  });
});
