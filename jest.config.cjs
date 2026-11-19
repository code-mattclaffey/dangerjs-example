/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // Collect coverage from every source file, not just the ones a test imports,
  // so untested legacy code counts against the total.
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.test.{ts,tsx}'],
  // `json` writes coverage/coverage-final.json, which danger/coverageReport.js reads.
  coverageReporters: ['json', 'text-summary'],
  // The ratchet: start just below today's numbers. When Danger says a metric is
  // more than 5 points above its threshold, raise it here in the same PR.
  coverageThreshold: {
    global: {
      statements: 20,
      branches: 0,
      functions: 55,
      lines: 20,
    },
  },
}
