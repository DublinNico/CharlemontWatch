const { computeComplaintTimeline } = require('../../controllers/incidentController');

// Thursday — matches the fixture used in businessDays.test.js
const NOW = new Date('2026-01-15T12:00:00Z');
const TWO_BUSINESS_DAYS_AGO = '2026-01-13T09:00:00Z';   // Tue
const FOURTEEN_BUSINESS_DAYS_AGO = '2025-12-23T09:00:00Z'; // Tue
const FIFTEEN_BUSINESS_DAYS_AGO = '2025-12-22T09:00:00Z';  // Mon
const THIRTY_BUSINESS_DAYS_AGO = '2025-12-01T09:00:00Z';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('computeComplaintTimeline', () => {
  test('UT-090: returns an entry for a sent complaint even when nothing is overdue yet', () => {
    const incident = {
      status: 'NEW',
      complaintsSent: [{ recipientType: 'tuath', sentAt: TWO_BUSINESS_DAYS_AGO }],
    };

    expect(computeComplaintTimeline(incident)).toEqual([{
      recipientType: 'tuath',
      sentAt: TWO_BUSINESS_DAYS_AGO,
      estimated: false,
      businessDaysElapsed: 2,
      responseThresholdDays: 30,
      responseOverdue: false,
    }]);
  });

  test('UT-095: Túath response overdue at the 30 working day threshold', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.responseThresholdDays).toBe(30);
    expect(entry.responseOverdue).toBe(true);
  });

  test('UT-095b: DCC response overdue at exactly its 15 working day threshold', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'dcc', sentAt: FIFTEEN_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.responseThresholdDays).toBe(15);
    expect(entry.responseOverdue).toBe(true);
  });

  test('UT-095c: DCC not yet response-overdue at 14 working days', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'dcc', sentAt: FOURTEEN_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.responseOverdue).toBe(false);
  });

  test('UT-096: mixed recipients tracked independently against their own thresholds', () => {
    const incident = {
      status: 'NEW',
      complaintsSent: [
        { recipientType: 'dcc', sentAt: FIFTEEN_BUSINESS_DAYS_AGO },  // overdue at DCC's 15-day threshold
        { recipientType: 'tuath', sentAt: FIFTEEN_BUSINESS_DAYS_AGO }, // not overdue at Túath's 30-day threshold
      ],
    };
    const [dcc, tuath] = computeComplaintTimeline(incident);
    expect(dcc.responseOverdue).toBe(true);
    expect(tuath.responseOverdue).toBe(false);
  });

  test('UT-097: returns an empty array when no complaint has been sent yet', () => {
    expect(computeComplaintTimeline({ status: 'NEW', complaintsSent: [] })).toEqual([]);
  });

  test('UT-098: still returns an entry for a RESOLVED incident, but responseOverdue is false regardless of elapsed time', () => {
    const incident = { status: 'RESOLVED', complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry).toBeDefined();
    expect(entry.responseOverdue).toBe(false);
  });

  test('UT-099: still returns an entry for a PENDING_REVIEW incident (edge case — complaints are normally only sent on approval)', () => {
    const incident = { status: 'PENDING_REVIEW', complaintsSent: [{ recipientType: 'dcc', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.responseOverdue).toBe(false);
  });

  test('UT-100: passes through the estimated flag for a backfilled sentAt', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'tuath', sentAt: TWO_BUSINESS_DAYS_AGO, estimated: true }] };
    expect(computeComplaintTimeline(incident)[0].estimated).toBe(true);
  });

  test('UT-101: defaults estimated to false when the field is absent (real confirmed sends)', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'tuath', sentAt: TWO_BUSINESS_DAYS_AGO }] };
    expect(computeComplaintTimeline(incident)[0].estimated).toBe(false);
  });
});
