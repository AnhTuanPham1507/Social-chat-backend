# Test Configuration and Structure

This directory contains the unified test configuration for the Social Chat Backend project.

## Structure

```
test/
├── README.md                 # This file
├── jest.config.js           # Main Jest configuration (orchestrates all tests)
├── jest.unit.config.js      # Unit test configuration
├── jest.e2e.config.js       # E2E test configuration
├── setup/                   # Shared test setup files
│   ├── unit-setup.ts        # Unit test global setup
│   └── e2e-setup.ts         # E2E test global setup
├── utils/                   # Shared test utilities
│   └── test-helpers.ts      # Common test helper functions
└── e2e-tests/              # E2E test files
    └── user/               # E2E tests by feature
```

## Module Test Structure

Each module should have its own `__tests__` directory:

```
src/modules/[module-name]/
├── __tests__/
│   ├── controllers/         # Controller tests
│   ├── application/         # Application service tests
│   ├── domain/             # Domain entity tests
│   ├── setup/              # Module-specific test setup (if needed)
│   ├── factories/          # Test data factories
│   ├── mocks/              # Module-specific mocks
│   └── *.spec.ts           # Test files
```

## Available Commands

### Run All Tests

```bash
npm test
```

Runs both unit tests and E2E tests with unified coverage reporting.

### Run Unit Tests Only

```bash
npm run test:unit
```

Runs all unit tests from `src/modules/**/__tests__/` directories.

### Run E2E Tests Only

```bash
npm run test:e2e
```

Runs all E2E tests from `test/e2e-tests/` directory.

### Watch Mode

```bash
npm run test:watch       # Watch all tests
npm run test:unit:watch  # Watch unit tests only
npm run test:e2e:watch   # Watch E2E tests only
```

### Coverage

```bash
npm run test:coverage
```

Runs all tests with coverage reporting. Coverage reports are generated in the `coverage/` directory.

## Writing Tests

### Unit Tests

Create test files in the module's `__tests__` directory:

```typescript
// src/modules/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TestHelpers } from '../../../../test/utils/test-helpers';

describe('AuthService', () => {
    let service: AuthService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await TestHelpers.createTestingModule([
            AuthService,
            // Add other providers
        ]);

        service = module.get<AuthService>(AuthService);
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
```

### E2E Tests

Create test files in the `test/e2e-tests/` directory:

```typescript
// test/e2e-tests/auth/auth.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelpers } from '../utils/test-helpers';

describe('Auth E2E', () => {
    let app: INestApplication;

    beforeEach(async () => {
        app = await TestHelpers.createTestApp(AppModule);
    });

    afterEach(async () => {
        await app.close();
    });

    it('/auth/login (POST)', () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
            .expect(200);
    });
});
```

## Test Utilities

### TestHelpers

The `TestHelpers` class provides common utilities:

- `createTestingModule(providers)` - Create a testing module
- `createTestApp(module)` - Create a NestJS app for E2E testing
- `generateRandomString(length)` - Generate random strings
- `generateRandomEmail()` - Generate random email addresses
- `createMockRepository()` - Create mock repository instances

### Example Usage

```typescript
import {
    TestHelpers,
    TEST_CONSTANTS,
} from '../../../../test/utils/test-helpers';

// Create a mock repository
const mockUserRepo = TestHelpers.createMockRepository();

// Generate test data
const testEmail = TestHelpers.generateRandomEmail();
const testString = TestHelpers.generateRandomString(10);
```

## Configuration

### Path Mapping

Tests can use the following path mappings:

- `@modules/*` - Maps to `src/modules/*`
- `@commons/*` - Maps to `src/commons/*`
- `@configs/*` - Maps to `src/configs/*`
- `@infras/*` - Maps to `src/infras/*`
- `@test/*` - Maps to `test/*`
- `src/*` - Maps to `src/*`

### Coverage Thresholds

Unit tests have coverage thresholds set to 70% for:

- Branches
- Functions
- Lines
- Statements

### Timeouts

- Unit tests: 10 seconds
- E2E tests: 30 seconds

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `beforeEach`/`afterEach` hooks to set up and clean up test state
3. **Mocking**: Mock external dependencies to keep tests fast and reliable
4. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
6. **One Assertion**: Prefer one logical assertion per test when possible

## Troubleshooting

### Common Issues

1. **Module Import Errors**: Ensure path mappings are correct in jest configurations
2. **Async Test Issues**: Always await async operations and properly handle promises
3. **Database Tests**: Use test databases and proper cleanup between tests
4. **Coverage Issues**: Check that files are properly included/excluded in coverage configuration

### Debug Mode

To debug tests, you can use:

```bash
node --inspect-brk node_modules/.bin/jest --config ./test/jest.config.js --runInBand
```

Then connect your debugger to the Node.js process.
