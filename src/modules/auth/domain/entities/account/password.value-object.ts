import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class Password extends ValueObject<string> {
    private static readonly MIN_LENGTH = 8;

    constructor(properties: ValueObjectProperties<string>) {
        super(properties);
    }

    public validate(properties: ValueObjectProperties<string>): void {
        // Skip validation if value is null or undefined (for non-LOCAL providers)
        if (!properties.value) return;
        
        const isValidPassword = properties.value.length >= Password.MIN_LENGTH;
        if (!isValidPassword) {
            throw new IllegalArgumentException('Invalid password');
        }
    }

    public static fromString(value: string) {
        return new Password({ value });
    }
}
