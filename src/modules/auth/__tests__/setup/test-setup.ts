import 'reflect-metadata';
// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// Global test configuration
beforeAll(() => {
    // Set up any global test configurations here
});

afterAll(() => {
    // Clean up after all tests
});

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock process.env for consistent testing
const originalEnv = process.env;

beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
});

afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
});

export {};
