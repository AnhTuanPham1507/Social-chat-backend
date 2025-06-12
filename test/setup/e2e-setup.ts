import 'reflect-metadata';

// Global test setup for e2e tests
beforeAll(async () => {
  // Setup global configurations for e2e tests
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/social_chat_test';
});

afterAll(async () => {
  // Cleanup after all e2e tests
  // Close database connections, cleanup test data, etc.
});

beforeEach(async () => {
  // Setup before each e2e test
  // Clean database, reset state, etc.
});

afterEach(async () => {
  // Cleanup after each e2e test
});

// Global test utilities for e2e tests can be added here 