const { businessDaysSince } = require('../../utils/businessDays');

// Thursday — fixed so every case below is deterministic regardless of when
// the suite actually runs.
const NOW = new Date('2026-01-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('businessDaysSince', () => {
  test('UT-077: returns 0 for the same day', () => {
    expect(businessDaysSince('2026-01-15T09:00:00Z')).toBe(0);
  });

  test('UT-078: counts a single weekday-to-weekday gap as 1', () => {
    expect(businessDaysSince('2026-01-14T09:00:00Z')).toBe(1); // Wed -> Thu
  });

  test('UT-079: excludes weekend days from the count', () => {
    // Fri 2026-01-09 -> Thu 2026-01-15 spans a full weekend; only Mon-Thu count
    expect(businessDaysSince('2026-01-09T09:00:00Z')).toBe(4);
  });

  test('UT-080: returns 30 at the overdue threshold boundary', () => {
    expect(businessDaysSince('2025-12-04T09:00:00Z')).toBe(30);
  });

  test('UT-081: returns 29 one working day short of the threshold', () => {
    expect(businessDaysSince('2025-12-05T09:00:00Z')).toBe(29);
  });

  test('UT-082: accepts a Date instance as well as an ISO string', () => {
    expect(businessDaysSince(new Date('2026-01-14T09:00:00Z'))).toBe(1);
  });
});
