module.exports = {
  displayName: 'E2E Tests',
  testMatch: [
    '<rootDir>/test/e2e-tests/**/*.spec.ts',
    '<rootDir>/test/e2e-tests/**/*.test.ts'
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup/e2e-setup.ts'],
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@commons/(.*)$': '<rootDir>/src/commons/$1',
    '^@configs/(.*)$': '<rootDir>/src/configs/$1',
    '^@infras/(.*)$': '<rootDir>/src/infras/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false, // E2E tests typically don't need coverage
  maxWorkers: 1, // E2E tests should run sequentially to avoid conflicts
}; 