const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

// ─── Pre-save hook (requires real DB) ────────────────────────────────────────

describe('User model — pre-save password hashing', () => {
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
    await User.deleteMany({});
  });

  test('UT-034-A: hashes the password before saving to the database', async () => {
    const user = new User({ email: 'hook@test.com', password: 'PlainText123!' });
    await user.save();
    expect(user.password).not.toBe('PlainText123!');
    expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix
  });

  test('UT-034-B: does not re-hash the password when an unrelated field is updated', async () => {
    const user = new User({ email: 'hook2@test.com', password: 'PlainText123!' });
    await user.save();
    const firstHash = user.password;

    user.name = 'Updated Name';
    await user.save();

    expect(user.password).toBe(firstHash);
  });
});

// comparePassword is an instance method — testable without a DB connection
// by constructing a User document with a pre-hashed password.

describe('User model — comparePassword', () => {
  let user;

  beforeAll(async () => {
    const hashed = await bcrypt.hash('SecurePass123!', 10);
    user = new User({
      email: 'tony@charlemontwatch.ie',
      password: hashed,
      name: 'Tony Nicoletti',
      role: 'resident',
    });
  });

  test('UT-019: returns true when the correct password is supplied', async () => {
    const result = await user.comparePassword('SecurePass123!');
    expect(result).toBe(true);
  });

  test('UT-020: returns false when an incorrect password is supplied', async () => {
    const result = await user.comparePassword('WrongPassword!');
    expect(result).toBe(false);
  });

  test('UT-021: returns false for an empty string password', async () => {
    const result = await user.comparePassword('');
    expect(result).toBe(false);
  });

  test('UT-022: returns false for a password that is close but not exact', async () => {
    const result = await user.comparePassword('securepass123!'); // wrong case
    expect(result).toBe(false);
  });
});

// ─── User model schema validation ─────────────────────────────────────────────

describe('User model — schema validation', () => {
  test('UT-023-A: fails validation when email is missing', () => {
    const doc = new User({ password: 'pass', name: 'Test' });
    const err = doc.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('UT-023-B: fails validation when password is missing', () => {
    const doc = new User({ email: 'test@test.com', name: 'Test' });
    const err = doc.validateSync();
    expect(err.errors.password).toBeDefined();
  });

  test('UT-024: defaults role to "resident"', () => {
    const doc = new User({ email: 'test@test.com', password: 'pass' });
    expect(doc.role).toBe('resident');
  });

  test('UT-025: rejects an invalid role value', () => {
    const doc = new User({ email: 'test@test.com', password: 'pass', role: 'superuser' });
    const err = doc.validateSync();
    expect(err.errors.role).toBeDefined();
  });
});
