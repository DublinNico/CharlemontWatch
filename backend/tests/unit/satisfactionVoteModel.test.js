const SatisfactionVote = require('../../models/SatisfactionVote');

// Mongoose validateSync() runs schema validation in memory without a DB connection.

const validFields = {
  email: 'jane@test.com',
  rating: 'high',
};

describe('SatisfactionVote model validation', () => {

  test('UT-043-A: fails validation when email is missing', () => {
    const doc = new SatisfactionVote({ ...validFields, email: undefined });
    const err = doc.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('UT-043-B: rejects an invalid email format', () => {
    const doc = new SatisfactionVote({ ...validFields, email: 'notanemail' });
    const err = doc.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('UT-043-C: fails validation when rating is missing', () => {
    const doc = new SatisfactionVote({ ...validFields, rating: undefined });
    const err = doc.validateSync();
    expect(err.errors.rating).toBeDefined();
  });

  test('UT-043-D: rejects an invalid rating value', () => {
    const doc = new SatisfactionVote({ ...validFields, rating: 'extreme' });
    const err = doc.validateSync();
    expect(err.errors.rating).toBeDefined();
  });

  test('UT-043-E: accepts "low" as a valid rating', () => {
    const doc = new SatisfactionVote({ ...validFields, rating: 'low' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-043-F: accepts "medium" as a valid rating', () => {
    const doc = new SatisfactionVote({ ...validFields, rating: 'medium' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-043-G: accepts "high" as a valid rating', () => {
    const doc = new SatisfactionVote({ ...validFields, rating: 'high' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });
});
