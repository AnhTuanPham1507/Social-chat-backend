import { Logger } from '@nestjs/common';

export interface RateLimiterOptions {
    maxRequests: number; // Maximum number of requests allowed in the time window
    timeWindow: number; // Time window in milliseconds
    delayAfterLimit?: number; // Delay in milliseconds to wait after hitting the limit
}

export class RateLimiter {
    private requests: number[] = [];
    private readonly logger = new Logger(RateLimiter.name);

    constructor(
        private readonly options: RateLimiterOptions = {
            maxRequests: 10,
            timeWindow: 1000, // 1 second
            delayAfterLimit: 1000, // 1 second
        },
    ) {}

    /**
     * Execute a function with rate limiting
     */
    public async execute<T>(
        fn: (...args: any[]) => Promise<T>,
        ...args: any[]
    ): Promise<T> {
        await this.checkAndWait();

        try {
            return await fn(...args);
        } finally {
            this.recordRequest();
        }
    }

    /**
     * Check if we need to wait before executing the request
     */
    private async checkAndWait(): Promise<void> {
        // Clean up old requests
        const now = Date.now();
        this.requests = this.requests.filter(
            (timestamp) => now - timestamp < this.options.timeWindow,
        );

        // Check if we're at the limit
        if (this.requests.length >= this.options.maxRequests) {
            const waitTime =
                this.options.delayAfterLimit || this.options.timeWindow;
            this.logger.warn(`Rate limit reached, waiting for ${waitTime}ms`);

            // Wait for the specified delay
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            // Recursively check again after waiting
            return this.checkAndWait();
        }
    }

    /**
     * Record a request
     */
    private recordRequest(): void {
        this.requests.push(Date.now());
    }

    /**
     * Get current request count in the time window
     */
    public getRequestCount(): number {
        const now = Date.now();
        this.requests = this.requests.filter(
            (timestamp) => now - timestamp < this.options.timeWindow,
        );
        return this.requests.length;
    }
}
