# Transactional Decorator Mock

This directory contains mock implementations for decorators used in the codebase. 

## Transactional Decorator Mock

The `transactional.decorator.mock.ts` file provides a mock implementation of the `@Transactional()` decorator from the `typeorm-transactional` package. This mock allows testing code that uses transactions without requiring an actual database connection.

### Features

- Simulates transaction behavior in tests
- Supports testing transaction rollback scenarios
- Tracks transaction states (active, completed, failed)
- Provides utilities to force transaction failures

### Usage

#### Basic Usage

The mock is automatically set up when you import it in your test setup file:

```typescript
// Import in your jest setup file
import '../path/to/transactional-mock.setup';
```

#### Testing Transaction Success

```typescript
import { TransactionMockState } from '../path/to/transactional-mock.setup';

it('should complete a transaction successfully', async () => {
  // Arrange
  TransactionMockState.reset(); // Reset state before test
  
  // Act
  await service.methodWithTransaction();
  
  // Assert
  expect(TransactionMockState.completedTransactions.length).toBeGreaterThan(0);
  expect(TransactionMockState.failedTransactions.length).toBe(0);
});
```

#### Testing Transaction Failures

```typescript
import { setTransactionsToFail, TransactionMockState } from '../path/to/transactional-mock.setup';

it('should handle transaction rollbacks', async () => {
  // Arrange
  TransactionMockState.reset(); // Reset state before test
  setTransactionsToFail(true); // Force transactions to fail
  
  // Act & Assert
  await expect(service.methodWithTransaction()).rejects.toThrow(/rolled back/);
  
  // Verify that the transaction was recorded as failed
  expect(TransactionMockState.failedTransactions.length).toBeGreaterThan(0);
  expect(TransactionMockState.completedTransactions.length).toBe(0);
  
  // Reset for other tests
  setTransactionsToFail(false);
});
```

#### Testing Partial Transaction Failures

```typescript
it('should handle partial transaction failures', async () => {
  // Arrange
  TransactionMockState.reset();
  
  // Mock a repository method to fail
  someRepo.save.mockRejectedValue(new Error('Database error'));
  
  // Act & Assert
  await expect(service.methodWithTransaction()).rejects.toThrow('Database error');
  
  // Verify the transaction state
  expect(TransactionMockState.failedTransactions.length).toBeGreaterThan(0);
});
```

### API Reference

#### TransactionMockState

An object that tracks the state of mock transactions:

- `shouldFail`: Boolean flag to control if all transactions should fail
- `activeTransactions`: Array of currently active transaction IDs
- `completedTransactions`: Array of successfully completed transaction IDs
- `failedTransactions`: Array of failed transaction IDs
- `reset()`: Method to reset all state to default values

#### Functions

- `setTransactionsToFail(shouldFail: boolean)`: Set whether all transactions should fail
- `setupTransactionalMock()`: Set up the mock and reset state (called automatically on import)
- `MockTransactional(options?: { shouldFail?: boolean })`: Decorator factory for manual usage

### Implementation Details

The mock works by wrapping the original method with a function that:

1. Tracks the transaction in `activeTransactions`
2. Executes the original method
3. Checks if the transaction should fail (globally or per-decorator)
4. Records success/failure in the appropriate state arrays
5. Throws appropriate errors for rollbacks 