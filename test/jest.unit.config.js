module.exports = {
    displayName: 'Unit Tests',
    testMatch: [
        '<rootDir>/@modules/**/__tests__/**/*.spec.ts',
        '<rootDir>/@modules/**/__tests__/**/*.test.ts',
    ],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '../',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        '@modules/**/*.(t|j)s',
        '!@modules/**/*.spec.ts',
        '!@modules/**/*.test.ts',
        '!@modules/**/*.interface.ts',
        '!@modules/**/*.dto.ts',
        '!@modules/**/*.constant.ts',
        '!@modules/**/__tests__/**/*',
    ],
    coverageDirectory: '<rootDir>/coverage/unit',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/test/setup/unit-setup.ts'],
    moduleNameMapper: {
        '^@modules/(.*)$': '<rootDir>/@modules/$1',
        '^@common/(.*)$': '<rootDir>/src/commons/$1',
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
