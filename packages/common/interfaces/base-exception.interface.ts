/**
 * Base domain exception class for all domain exceptions
 * Extends Error to provide custom error handling
 */
export class DomainException extends Error {
    constructor(
        public readonly code: string,
        public readonly message: string,
        public readonly cause?: Error,
    ) {
        super(message);
        this.name = 'DomainException';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Base exception for all domain-specific exceptions
 */
export class BaseDomainException extends DomainException {
    public code: string;
    public readonly args: object;

    constructor(code: string, args: object = {}, cause?: Error) {
        super(code, '', cause);
        this.code = code;
        this.args = args;
    }
}
