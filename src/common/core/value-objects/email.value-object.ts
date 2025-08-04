import { IllegalArgumentException } from '@beincom/common';
import { ValueObject, ValueObjectProperties } from '@beincom/domain';

export class Email extends ValueObject<string> {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    constructor(properties: ValueObjectProperties<string>) {
        super(properties);
    }

    public validate(properties: ValueObjectProperties<string>): void {
        if (!properties.value.match(Email.EMAIL_REGEX)) {
            throw new IllegalArgumentException('Invalid email');
        }
    }

    public static fromString(value: string) {
        return new Email({ value });
    }
}
