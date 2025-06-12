const path = require('path');

module.exports = {
    projects: [
        path.join(__dirname, 'jest.unit.config.js'),
        path.join(__dirname, 'jest.e2e.config.js'),
    ],
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/',
        '/test/',
        '.interface.ts',
        '.dto.ts',
        '.constant.ts',
        '.spec.ts',
    ],
    verbose: true,
};
