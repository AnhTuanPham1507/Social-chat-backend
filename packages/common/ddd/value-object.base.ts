export interface ValueObjectProperties<T> {
    value: T;
}

export type DomainPrimitiveProperties<T> = ValueObjectProperties<T>;

export type NullAbleValueType<T> = T | null | undefined;

/**
 * Decorator to mark a value object as nullable
 */
export function NullAbleValue() {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return constructor;
    };
}

export abstract class ValueObject<T> {
    protected readonly _value: T;

    constructor(properties: ValueObjectProperties<T>) {
        this.validate(properties);
        this._value = properties.value;
    }

    public get value(): T {
        return this._value;
    }

    public abstract validate(properties: ValueObjectProperties<T>): void;

    public equals(other: ValueObject<T>): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this._value === other._value;
    }
}
