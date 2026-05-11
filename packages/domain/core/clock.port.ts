/**
 * Port for reading the current time.
 *
 * Injected wherever code needs to stamp "now" — most importantly at
 * the application-service boundary where `serverTs` is assigned to
 * a message. Having a port (rather than `new Date()` everywhere) makes
 * time injectable in tests and keeps the domain layer free of
 * `Date.now()` side effects.
 */
export interface IClock {
    now(): Date;
}

export const CLOCK_TOKEN = Symbol('CLOCK_TOKEN');
