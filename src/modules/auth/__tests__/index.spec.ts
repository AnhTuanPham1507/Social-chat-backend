/**
 * Auth Module Test Suite
 * 
 * This file serves as the entry point for all auth module tests.
 * It imports all test files to ensure they are executed together.
 */

// Import all test files
import './application/auth.application-service.spec';
import './controllers/auth.controller.spec';
import './controllers/auth.web-hook.spec';

describe('Auth Module Test Suite', () => {
  it('should load all auth module tests', () => {
    expect(true).toBe(true);
  });
}); 