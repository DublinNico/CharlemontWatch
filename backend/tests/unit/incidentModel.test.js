const mongoose = require('mongoose');
const Incident = require('../../models/Incident');

// Mongoose validateSync() runs schema validation in memory without a DB connection.

// All required fields, spread into each test doc and overridden as needed.
// complainantName/complainantAddress are NOT required — only reporterEmail is,
// so a report can still be submitted anonymously (no name/address, no complaint).
const validFields = {
  incidentType: 'graffiti',
  location: 'Block A',
  description: 'Test',
  reporterEmail: 'jane@test.com',
};

describe('Incident model validation', () => {

  // ─── Required fields ─────────────────────────────────────────────────────

  test('UT-014-A: fails validation when incidentType is missing', () => {
    const doc = new Incident({ ...validFields, incidentType: undefined });
    const err = doc.validateSync();
    expect(err.errors.incidentType).toBeDefined();
  });

  test('UT-014-B: fails validation when location is missing', () => {
    const doc = new Incident({ ...validFields, location: undefined });
    const err = doc.validateSync();
    expect(err.errors.location).toBeDefined();
  });

  test('UT-014-C: fails validation when description is missing', () => {
    const doc = new Incident({ ...validFields, description: undefined });
    const err = doc.validateSync();
    expect(err.errors.description).toBeDefined();
  });

  test('UT-014-D: fails validation when reporterEmail is missing', () => {
    const doc = new Incident({ ...validFields, reporterEmail: undefined });
    const err = doc.validateSync();
    expect(err.errors.reporterEmail).toBeDefined();
  });

  test('UT-014-E: allows complainantName and complainantAddress to be omitted (anonymous report)', () => {
    const doc = new Incident({ ...validFields });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  // ─── Enum: incidentType ───────────────────────────────────────────────────

  test('UT-015-A: rejects an invalid incidentType value', () => {
    const doc = new Incident({
      incidentType: 'vandalism',
      location: 'Block A',
      description: 'Test',
    });
    const err = doc.validateSync();
    expect(err.errors.incidentType).toBeDefined();
  });

  test('UT-015-B: accepts "graffiti" as a valid incidentType', () => {
    const doc = new Incident({ ...validFields, incidentType: 'graffiti' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-015-C: accepts "antisocial" as a valid incidentType', () => {
    const doc = new Incident({ ...validFields, incidentType: 'antisocial' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-015-D: accepts "safetyhazard" as a valid incidentType', () => {
    const doc = new Incident({ ...validFields, incidentType: 'safetyhazard' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-015-E: accepts "maintenance" as a valid incidentType', () => {
    const doc = new Incident({ ...validFields, incidentType: 'maintenance' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  // ─── Enum: status ─────────────────────────────────────────────────────────

  test('UT-016-A: rejects an invalid status value', () => {
    const doc = new Incident({ ...validFields, status: 'PENDING' });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  test('UT-016-B: defaults status to "PENDING_REVIEW" when not provided', () => {
    const doc = new Incident({ ...validFields });
    expect(doc.status).toBe('PENDING_REVIEW');
  });

  test('UT-016-C: accepts "IN_PROGRESS" as a valid status', () => {
    const doc = new Incident({ ...validFields, status: 'IN_PROGRESS' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-016-D: accepts "RESOLVED" as a valid status', () => {
    const doc = new Incident({ ...validFields, status: 'RESOLVED' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  // ─── Photos array ─────────────────────────────────────────────────────────

  test('UT-017: photos array defaults to empty', () => {
    const doc = new Incident({ ...validFields });
    expect(doc.photos).toHaveLength(0);
  });

  test('UT-018: allows up to 10 photo objects to be pushed', () => {
    const doc = new Incident({ ...validFields });
    for (let i = 0; i < 10; i++) {
      doc.photos.push({ url: `https://s3.example.com/photo${i}.jpg` });
    }
    expect(doc.photos).toHaveLength(10);
  });

  // ─── reporterEmail validation ─────────────────────────────────────────────

  test('UT-033-A: rejects an invalid reporterEmail format', () => {
    const doc = new Incident({ ...validFields, reporterEmail: 'notanemail' });
    const err = doc.validateSync();
    expect(err.errors.reporterEmail).toBeDefined();
  });

  test('UT-033-B: accepts a valid reporterEmail', () => {
    const doc = new Incident({ ...validFields, reporterEmail: 'resident@test.com' });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('UT-033-C: fails validation when reporterEmail is missing, even with no complaint fields set', () => {
    const doc = new Incident({ incidentType: 'graffiti', location: 'Block A', description: 'Test' });
    const err = doc.validateSync();
    expect(err.errors.reporterEmail).toBeDefined();
  });
});
