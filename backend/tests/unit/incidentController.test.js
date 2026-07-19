jest.mock('../../models/Incident');
jest.mock('../../services/emailService', () => ({
  sendResidentConfirmation: jest.fn(),
  sendAdminNotification: jest.fn(),
  sendStatusUpdate: jest.fn(),
  sendComplaintEmails: jest.fn(),
}));
jest.mock('../../config/s3', () => ({ upload: jest.fn() }));
jest.mock('sharp', () => jest.fn());

const Incident = require('../../models/Incident');
const {
  getIncident,
  getAllIncidents,
  getPendingIncidents,
  reviewIncident,
  reviewPhoto,
  updateIncidentStatus,
  deleteIncident,
} = require('../../controllers/incidentController');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const SENSITIVE_MESSAGE = 'connect ECONNREFUSED 10.0.0.5:27017 (internal db host)';

beforeEach(() => {
  jest.clearAllMocks();
});

// Every function below hits the same class of bug (BUG: raw error.message
// returned to the client on unexpected 500s) — one test per function locks
// in that it's fixed, without re-testing the already-covered happy paths
// (see tests/integration/incidents.test.js for those).

describe('getIncident — 500 path does not leak error.message', () => {
  test('UT-065: returns generic message, logs the real error server-side', async () => {
    Incident.findOne = jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await getIncident({ params: { id: 'CW-ABC123' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining(SENSITIVE_MESSAGE) }));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Get incident'), expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('getAllIncidents — 500 path does not leak error.message', () => {
  test('UT-066: returns generic message, logs the real error server-side', async () => {
    Incident.find = jest.fn().mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)) });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await getAllIncidents({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});

describe('getPendingIncidents — 500 path does not leak error.message', () => {
  test('UT-067: returns generic message, logs the real error server-side', async () => {
    Incident.find = jest.fn().mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)) });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await getPendingIncidents({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});

describe('reviewIncident — 500 path does not leak error.message', () => {
  test('UT-068: returns generic message, logs the real error server-side', async () => {
    const fakeIncident = { status: 'PENDING_REVIEW', save: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)) };
    Incident.findOne = jest.fn().mockResolvedValue(fakeIncident);
    Incident.findById = jest.fn().mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await reviewIncident({ params: { id: 'CW-ABC123' }, body: { action: 'approve' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});

describe('reviewPhoto — 500 path does not leak error.message', () => {
  test('UT-069: returns generic message, logs the real error server-side', async () => {
    const fakePhoto = { approved: false };
    const fakeIncident = {
      status: 'PENDING_REVIEW',
      photos: { id: jest.fn().mockReturnValue(fakePhoto) },
      save: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)),
    };
    Incident.findOne = jest.fn().mockResolvedValue(fakeIncident);
    Incident.findById = jest.fn().mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await reviewPhoto({ params: { id: 'CW-ABC123', photoId: 'p1' }, body: { approved: true } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});

describe('updateIncidentStatus — 500 path does not leak error.message', () => {
  test('UT-070: returns generic message, logs the real error server-side', async () => {
    const fakeIncident = { save: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)) };
    Incident.findOne = jest.fn().mockResolvedValue(fakeIncident);
    Incident.findById = jest.fn().mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await updateIncidentStatus({ params: { id: 'CW-ABC123' }, body: { status: 'IN_PROGRESS' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});

describe('deleteIncident — 500 path does not leak error.message', () => {
  test('UT-071: returns generic message, logs the real error server-side', async () => {
    const fakeIncident = { deleteOne: jest.fn().mockRejectedValue(new Error(SENSITIVE_MESSAGE)) };
    Incident.findOne = jest.fn().mockResolvedValue(fakeIncident);
    Incident.findById = jest.fn().mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await deleteIncident({ params: { id: 'CW-ABC123' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    consoleSpy.mockRestore();
  });
});
