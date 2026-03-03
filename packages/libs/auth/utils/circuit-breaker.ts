import { Logger } from '@nestjs/common';

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    fallbackFn?: (...args: any[]) => any;
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly logger = new Logger(CircuitBreaker.name);

    constructor(
        private readonly options: CircuitBreakerOptions = {
            failureThreshold: 5,
            resetTimeout: 30000,
        },
    ) {}

    public async execute<T>(
        fn: (...args: any[]) => Promise<T>,
        ...args: any[]
    ): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (
                Date.now() - this.lastFailureTime >=
                this.options.resetTimeout
            ) {
                this.logger.log('Circuit half-open, testing service...');
                this.state = CircuitState.HALF_OPEN;
            } else {
                this.logger.warn('Circuit open, failing fast');
                return this.handleOpenCircuit(args);
            }
        }

        try {
            const result = await fn(...args);
            this.handleSuccess();
            return result;
        } catch (error) {
            return this.handleFailure(error, args);
        }
    }

    private handleSuccess(): void {
        if (this.state === CircuitState.HALF_OPEN) {
            this.logger.log('Service is back online, closing circuit');
            this.reset();
        }
    }

    private handleFailure(error: any, args: any[]): any {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (
            this.state === CircuitState.CLOSED &&
            this.failureCount >= this.options.failureThreshold
        ) {
            this.logger.warn(
                `Failure threshold reached (${this.failureCount}/${this.options.failureThreshold}), opening circuit`,
            );
            this.state = CircuitState.OPEN;
        }

        if (this.state === CircuitState.HALF_OPEN) {
            this.logger.warn(
                'Service still failing in half-open state, reopening circuit',
            );
            this.state = CircuitState.OPEN;
        }

        if (this.state === CircuitState.OPEN && this.options.fallbackFn) {
            return this.options.fallbackFn(...args);
        }

        throw error;
    }

    private reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.lastFailureTime = 0;
    }

    private handleOpenCircuit(args: any[]): any {
        if (this.options.fallbackFn) {
            return this.options.fallbackFn(...args);
        }

        throw new Error('Circuit is open, request rejected');
    }

    public getState(): CircuitState {
        return this.state;
    }
}
