import 'reflect-metadata';
import '../../src/modules/auth/__tests__/setup/transactional-mock.setup';

// Global test setup for unit tests
beforeAll(async () => {
    // Setup global mocks and configurations for unit tests
    process.env.NODE_ENV = 'test';
});

afterAll(async () => {
    // Cleanup after all tests
});

beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});

// Global test utilities and mocks can be added here
global.console = {
    ...console,
    // Suppress console.log in tests unless specifically needed
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
};
