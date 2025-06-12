// Mock for the Transactional decorator from typeorm-transactional
// This enhanced mock supports testing transaction rollback scenarios

// Track transaction state globally
export const TransactionMockState = {
  shouldFail: false,
  failedTransactions: [] as string[],
  activeTransactions: [] as string[],
  completedTransactions: [] as string[],
  reset: function() {
    this.shouldFail = false;
    this.failedTransactions = [];
    this.activeTransactions = [];
    this.completedTransactions = [];
  }
};

/**
 * Enhanced mock implementation of the Transactional decorator
 * Supports simulating successful transactions and rollback scenarios
 * 
 * @param options Optional configuration for the mock transaction
 * @returns Method decorator
 */
export function MockTransactional(options?: { shouldFail?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Replace the original method with our transaction-aware wrapper
    descriptor.value = async function(...args: any[]) {
      const transactionId = `${target.constructor.name}.${propertyKey}:${Date.now()}`;
      TransactionMockState.activeTransactions.push(transactionId);
      
      console.log(`[MOCK TRANSACTION] Starting transaction: ${transactionId}`);
      
      try {
        // Check if this specific transaction should fail or if global failure is set
        const shouldFailTransaction = options?.shouldFail || TransactionMockState.shouldFail;
        
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        if (shouldFailTransaction) {
          // Simulate transaction failure
          TransactionMockState.failedTransactions.push(transactionId);
          console.log(`[MOCK TRANSACTION] Rolling back transaction: ${transactionId}`);
          throw new Error(`Transaction ${transactionId} rolled back (simulated)`);
        }
        
        // Transaction succeeded
        console.log(`[MOCK TRANSACTION] Committing transaction: ${transactionId}`);
        TransactionMockState.completedTransactions.push(transactionId);
        return result;
      } catch (error) {
        // If error is already from our simulated rollback, just re-throw
        if (error.message?.includes('rolled back (simulated)')) {
          throw error;
        }
        
        // Otherwise, handle original method errors
        console.log(`[MOCK TRANSACTION] Error in transaction ${transactionId}: ${error.message}`);
        TransactionMockState.failedTransactions.push(transactionId);
        throw error;
      } finally {
        // Remove from active transactions
        const index = TransactionMockState.activeTransactions.indexOf(transactionId);
        if (index > -1) {
          TransactionMockState.activeTransactions.splice(index, 1);
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility function to force all transactions to fail
 * Use this in tests to simulate database failures
 * 
 * @param shouldFail Whether transactions should fail
 */
export function setTransactionsToFail(shouldFail = true) {
  TransactionMockState.shouldFail = shouldFail;
}

/**
 * Jest mock setup function for the Transactional decorator
 * Use this in your test setup to mock the Transactional decorator
 */
export function setupTransactionalMock() {
  // Reset the transaction state
  TransactionMockState.reset();
  
  jest.mock('typeorm-transactional', () => ({
    // Mock other exports from typeorm-transactional
    initializeTransactionalContext: jest.fn(),
    addTransactionalDataSource: jest.fn(),
    
    // Mock the Transactional decorator using our enhanced implementation
    Transactional: (options?: any) => {
      return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args: any[]) {
          const transactionId = `${target.constructor.name}.${propertyKey}:${Date.now()}`;
          TransactionMockState.activeTransactions.push(transactionId);
          
          try {
            // Check if transactions should fail
            if (TransactionMockState.shouldFail) {
              TransactionMockState.failedTransactions.push(transactionId);
              throw new Error(`Transaction ${transactionId} rolled back (simulated)`);
            }
            
            // Execute the original method
            const result = await originalMethod.apply(this, args);
            
            // Transaction succeeded
            TransactionMockState.completedTransactions.push(transactionId);
            return result;
          } catch (error) {
            // Record failure and re-throw
            if (!TransactionMockState.failedTransactions.includes(transactionId)) {
              TransactionMockState.failedTransactions.push(transactionId);
            }
            throw error;
          } finally {
            // Remove from active transactions
            const index = TransactionMockState.activeTransactions.indexOf(transactionId);
            if (index > -1) {
              TransactionMockState.activeTransactions.splice(index, 1);
            }
          }
        };
        
        return descriptor;
      };
    },
  }));
} 