import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * Test utilities for creating test modules and applications
 */
export class TestHelpers {
  /**
   * Create a testing module with providers
   */
  static async createTestingModule(providers: any[]): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      providers,
    });

    return moduleBuilder.compile();
  }

  /**
   * Create a NestJS application for e2e testing
   */
  static async createTestApp(module: any): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [module],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  /**
   * Generate random test data
   */
  static generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * Generate random email for testing
   */
  static generateRandomEmail(): string {
    return `test-${this.generateRandomString(8)}@example.com`;
  }

  /**
   * Wait for a specified amount of time (useful for async operations)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock repository
   */
  static createMockRepository<T = any>(): Partial<T> {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
    } as any;
  }
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  DEFAULT_TIMEOUT: 10000,
  E2E_TIMEOUT: 30000,
  TEST_EMAIL: 'test@example.com',
  TEST_PASSWORD: 'testPassword123',
} as const; 