module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
  ],
};
