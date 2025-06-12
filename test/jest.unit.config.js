module.exports = {
  displayName: 'Unit Tests',
  testMatch: [
    '<rootDir>/src/modules/**/__tests__/**/*.spec.ts',
    '<rootDir>/src/modules/**/__tests__/**/*.test.ts'
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/modules/**/*.(t|j)s',
    '!src/modules/**/*.spec.ts',
    '!src/modules/**/*.test.ts',
    '!src/modules/**/*.interface.ts',
    '!src/modules/**/*.dto.ts',
    '!src/modules/**/*.constant.ts',
    '!src/modules/**/__tests__/**/*',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/unit-setup.ts'],
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@commons/(.*)$': '<rootDir>/src/commons/$1',
    '^@configs/(.*)$': '<rootDir>/src/configs/$1',
    '^@infras/(.*)$': '<rootDir>/src/infras/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 65,
      lines: 60,
      statements: 55,
    },
  },
}; 