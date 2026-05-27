const { generateShortId } = require('../../utils/idUtils');

describe('generateShortId (UT-001, UT-002)', () => {
  test('UT-001-A: returns a string', () => {
    expect(typeof generateShortId()).toBe('string');
  });

  test('UT-001-B: matches format CW-XXXXXX (6 uppercase hex characters)', () => {
    const id = generateShortId();
    expect(id).toMatch(/^CW-[0-9A-F]{6}$/);
  });

  test('UT-001-C: always begins with the CW- prefix', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateShortId()).toMatch(/^CW-/);
    }
  });

  test('UT-001-D: total length is always 9 characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateShortId()).toHaveLength(9);
    }
  });

  test('UT-002: generates unique IDs across 500 calls', () => {
    const ids = new Set(Array.from({ length: 500 }, generateShortId));
    expect(ids.size).toBe(500);
  });
});
