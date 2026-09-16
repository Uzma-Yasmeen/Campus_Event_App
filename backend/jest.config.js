module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Spinning up an in-memory MongoDB on a cold cache can take a while.
  testTimeout: 30000,
  // The suites share one database, so run them one at a time.
  maxWorkers: 1,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js'
  ]
};
