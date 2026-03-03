import { Logger } from '@nestjs/common';

export interface RateLimiterOptions {
    maxRequests: number;
    timeWindow: number;
    delayAfterLimit?: number;
}

export class RateLimiter {
    private requests: number[] = [];
    private readonly logger = new Logger(RateLimiter.name);

    constructor(
        private readonly options: RateLimiterOptions = {
            maxRequests: 10,
            timeWindow: 1000,
            delayAfterLimit: 1000,
        },
    ) {}

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

    private async checkAndWait(): Promise<void> {
        const now = Date.now();
        this.requests = this.requests.filter(
            (timestamp) => now - timestamp < this.options.timeWindow,
        );

        if (this.requests.length >= this.options.maxRequests) {
            const waitTime =
                this.options.delayAfterLimit || this.options.timeWindow;
            this.logger.warn(`Rate limit reached, waiting for ${waitTime}ms`);

            await new Promise((resolve) => setTimeout(resolve, waitTime));

            return this.checkAndWait();
        }
    }

    private recordRequest(): void {
        this.requests.push(Date.now());
    }

    public getRequestCount(): number {
        const now = Date.now();
        this.requests = this.requests.filter(
            (timestamp) => now - timestamp < this.options.timeWindow,
        );
        return this.requests.length;
    }
}
