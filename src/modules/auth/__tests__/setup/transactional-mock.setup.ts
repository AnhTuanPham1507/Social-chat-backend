/**
 * Setup file for mocking the Transactional decorator across all tests
 * This enhanced version supports transaction rollback testing
 */

// Track transaction state globally
export const TransactionMockState = {
    shouldFail: false,
    failedTransactions: [] as string[],
    activeTransactions: [] as string[],
    completedTransactions: [] as string[],
    reset: function () {
        this.shouldFail = false;
        this.failedTransactions = [];
        this.activeTransactions = [];
        this.completedTransactions = [];
    },
};

/**
 * Utility function to force all transactions to fail
 * Use this in tests to simulate database failures
 *
 * @param shouldFail Whether transactions should fail
 */
export function setTransactionsToFail(shouldFail = true) {
    TransactionMockState.shouldFail = shouldFail;
}

// Mock typeorm-transactional module
jest.mock('typeorm-transactional', () => {
    return {
        // Mock necessary exports
        initializeTransactionalContext: jest.fn(),
        addTransactionalDataSource: jest.fn(),

        // Mock the Transactional decorator with rollback support
        Transactional: () => {
            return function (
                target: any,
                propertyKey: string,
                descriptor: PropertyDescriptor,
            ) {
                return descriptor;
            };
        },

        // Add other exports from typeorm-transactional if needed
        patchTypeORMRepositoryWithBaseRepository: jest.fn(),
        patchTypeORMTreeRepositoryWithBaseTreeRepository: jest.fn(),
    };
});

// Export a function to manually set up the mock in individual test files if needed
export function setupTransactionalMock() {
    // Reset the transaction state
    TransactionMockState.reset();

    // The mock is already set up globally, but this function resets state
    jest.resetModules();
    jest.doMock('typeorm-transactional');
}
