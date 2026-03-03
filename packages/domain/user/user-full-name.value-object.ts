import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';
import { IllegalArgumentException } from '@beincom/common';

export class UserFullName extends ValueObject<string> {
    private static readonly MIN_LENGTH = 2;
    private static readonly MAX_LENGTH = 100;

    constructor(properties: ValueObjectProperties<string>) {
        super(properties);
    }

    public validate({ value }: DomainPrimitiveProperties<string>): void {
        const trimmed = value.trim();

        if (!trimmed) {
            throw new IllegalArgumentException('Full name is required');
        }

        if (
            trimmed.length < UserFullName.MIN_LENGTH ||
            trimmed.length > UserFullName.MAX_LENGTH
        ) {
            throw new IllegalArgumentException(
                `Full name must be between ${UserFullName.MIN_LENGTH} and ${UserFullName.MAX_LENGTH} characters`,
            );
        }
    }

    public static fromString(value: string): UserFullName {
        return new UserFullName({ value: value.trim() });
    }
}
