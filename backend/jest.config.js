module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/tests/security/**/*.test.js',
  ],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    'app.js',
  ],
  moduleNameMapper: {
    '^resend$': '<rootDir>/__mocks__/resend.js',
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },
};
