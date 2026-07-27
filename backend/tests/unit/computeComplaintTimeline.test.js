const { computeComplaintTimeline } = require('../../controllers/incidentController');

// Thursday — matches the fixture used in businessDays.test.js
const NOW = new Date('2026-01-15T12:00:00Z');
const TWO_BUSINESS_DAYS_AGO = '2026-01-13T09:00:00Z';   // Tue
const THREE_BUSINESS_DAYS_AGO = '2026-01-12T09:00:00Z'; // Mon
const FOUR_BUSINESS_DAYS_AGO = '2026-01-09T09:00:00Z';  // Fri
const FIVE_BUSINESS_DAYS_AGO = '2026-01-08T09:00:00Z';  // Thu
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
      acknowledgementThresholdDays: 5,
      acknowledgementOverdue: false,
      responseThresholdDays: 30,
      responseOverdue: false,
    }]);
  });

  test('UT-091: DCC acknowledgement overdue at exactly 3 working days', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'dcc', sentAt: THREE_BUSINESS_DAYS_AGO }] };
    expect(computeComplaintTimeline(incident)[0].acknowledgementOverdue).toBe(true);
  });

  test('UT-092: DCC not yet acknowledgement-overdue at 2 working days', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'dcc', sentAt: TWO_BUSINESS_DAYS_AGO }] };
    expect(computeComplaintTimeline(incident)[0].acknowledgementOverdue).toBe(false);
  });

  test('UT-093: Tuath acknowledgement overdue at exactly 5 working days', () => {
    const incident = { status: 'IN_PROGRESS', complaintsSent: [{ recipientType: 'tuath', sentAt: FIVE_BUSINESS_DAYS_AGO }] };
    expect(computeComplaintTimeline(incident)[0].acknowledgementOverdue).toBe(true);
  });

  test('UT-094: Tuath not yet acknowledgement-overdue at 4 working days', () => {
    const incident = { status: 'IN_PROGRESS', complaintsSent: [{ recipientType: 'tuath', sentAt: FOUR_BUSINESS_DAYS_AGO }] };
    expect(computeComplaintTimeline(incident)[0].acknowledgementOverdue).toBe(false);
  });

  test('UT-095: response overdue at the 30 working day threshold, and implies acknowledgement overdue too', () => {
    const incident = { status: 'NEW', complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.responseOverdue).toBe(true);
    expect(entry.acknowledgementOverdue).toBe(true);
  });

  test('UT-096: mixed recipients — one acknowledgement-overdue, the other still on track', () => {
    const incident = {
      status: 'NEW',
      complaintsSent: [
        { recipientType: 'dcc', sentAt: THREE_BUSINESS_DAYS_AGO },  // overdue (>= 3)
        { recipientType: 'tuath', sentAt: THREE_BUSINESS_DAYS_AGO }, // not overdue (< 5)
      ],
    };
    const [dcc, tuath] = computeComplaintTimeline(incident);
    expect(dcc.acknowledgementOverdue).toBe(true);
    expect(tuath.acknowledgementOverdue).toBe(false);
  });

  test('UT-097: returns an empty array when no complaint has been sent yet', () => {
    expect(computeComplaintTimeline({ status: 'NEW', complaintsSent: [] })).toEqual([]);
  });

  test('UT-098: still returns an entry for a RESOLVED incident, but both overdue flags are false regardless of elapsed time', () => {
    const incident = { status: 'RESOLVED', complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry).toBeDefined();
    expect(entry.acknowledgementOverdue).toBe(false);
    expect(entry.responseOverdue).toBe(false);
  });

  test('UT-099: still returns an entry for a PENDING_REVIEW incident (edge case — complaints are normally only sent on approval)', () => {
    const incident = { status: 'PENDING_REVIEW', complaintsSent: [{ recipientType: 'dcc', sentAt: THIRTY_BUSINESS_DAYS_AGO }] };
    const entry = computeComplaintTimeline(incident)[0];
    expect(entry.acknowledgementOverdue).toBe(false);
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
