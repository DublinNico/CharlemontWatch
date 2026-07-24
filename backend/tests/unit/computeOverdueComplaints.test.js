const { computeOverdueComplaints } = require('../../controllers/incidentController');

// Thursday — matches the fixture used in businessDays.test.js
const NOW = new Date('2026-01-15T12:00:00Z');
// 2025-12-01 -> 2026-01-15 crosses Christmas Day, St. Stephen's Day, and New
// Year's Day, all excluded as Irish public holidays (see businessDays.test.js)
const THIRTY_BUSINESS_DAYS_AGO = '2025-12-01T09:00:00Z';
const TWENTY_NINE_BUSINESS_DAYS_AGO = '2025-12-02T09:00:00Z';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('computeOverdueComplaints', () => {
  test('UT-083: flags a complaint sent exactly 30 working days ago', () => {
    const incident = {
      status: 'NEW',
      complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }],
    };

    expect(computeOverdueComplaints(incident)).toEqual([
      { recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO, businessDaysElapsed: 30 },
    ]);
  });

  test('UT-084: does not flag a complaint sent 29 working days ago', () => {
    const incident = {
      status: 'NEW',
      complaintsSent: [{ recipientType: 'tuath', sentAt: TWENTY_NINE_BUSINESS_DAYS_AGO }],
    };

    expect(computeOverdueComplaints(incident)).toEqual([]);
  });

  test('UT-085: only flags the recipient that has actually passed the threshold', () => {
    const incident = {
      status: 'IN_PROGRESS',
      complaintsSent: [
        { recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO },
        { recipientType: 'dcc', sentAt: TWENTY_NINE_BUSINESS_DAYS_AGO },
      ],
    };

    const result = computeOverdueComplaints(incident);
    expect(result).toHaveLength(1);
    expect(result[0].recipientType).toBe('tuath');
  });

  test('UT-086: returns nothing when no complaint has been sent yet', () => {
    expect(computeOverdueComplaints({ status: 'NEW', complaintsSent: [] })).toEqual([]);
  });

  test('UT-087: returns nothing when complaintsSent is undefined', () => {
    expect(computeOverdueComplaints({ status: 'NEW' })).toEqual([]);
  });

  test('UT-088-A: never flags a PENDING_REVIEW incident, even if long overdue', () => {
    const incident = {
      status: 'PENDING_REVIEW',
      complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }],
    };
    expect(computeOverdueComplaints(incident)).toEqual([]);
  });

  test('UT-088-B: never flags a RESOLVED incident, even if long overdue', () => {
    const incident = {
      status: 'RESOLVED',
      complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }],
    };
    expect(computeOverdueComplaints(incident)).toEqual([]);
  });

  test('UT-088-C: never flags a REJECTED incident, even if long overdue', () => {
    const incident = {
      status: 'REJECTED',
      complaintsSent: [{ recipientType: 'tuath', sentAt: THIRTY_BUSINESS_DAYS_AGO }],
    };
    expect(computeOverdueComplaints(incident)).toEqual([]);
  });
});
