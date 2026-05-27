const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'charlemont-test-secret-key';

const { authenticate, adminOnly } = require('../../middleware/auth');

// ─── authenticate ─────────────────────────────────────────────────────────────

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('UT-005: returns 401 and error message when no Authorization header is present', () => {
    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UT-006-A: calls next() when token is valid', () => {
    const token = jwt.sign(
      { _id: 'abc123', email: 'user@test.com', role: 'resident' },
      'charlemont-test-secret-key',
      { expiresIn: '1h' }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('UT-006-B: attaches decoded payload to req.user when token is valid', () => {
    const payload = { _id: 'abc123', email: 'user@test.com', role: 'resident' };
    const token = jwt.sign(payload, 'charlemont-test-secret-key', { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('user@test.com');
    expect(req.user.role).toBe('resident');
  });

  test('UT-007-A: returns 401 for a tampered (invalid signature) token', () => {
    req.headers.authorization = 'Bearer invalid.token.value';

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UT-007-B: returns 401 for an expired token', () => {
    const token = jwt.sign(
      { _id: 'abc123', email: 'user@test.com', role: 'resident' },
      'charlemont-test-secret-key',
      { expiresIn: '-1s' }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── adminOnly ────────────────────────────────────────────────────────────────

describe('adminOnly middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('UT-008: calls next() when req.user has role "admin"', () => {
    req.user = { role: 'admin' };

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('UT-009-A: returns 403 when req.user has role "resident"', () => {
    req.user = { role: 'resident' };

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UT-009-B: returns 403 when req.user has an unknown role', () => {
    req.user = { role: 'superuser' };

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('UT-010: returns 403 when req.user is undefined (unauthenticated)', () => {
    req.user = undefined;

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
