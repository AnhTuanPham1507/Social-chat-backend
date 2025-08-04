import { IllegalArgumentException } from '@beincom/common';
import { DomainPrimitiveProperties, ValueObject } from '@beincom/domain';

export class URL extends ValueObject<string> {
    private static readonly URL_REGEX =
        /^(https?:\/\/)(localhost(:[0-9]+)?|([\da-z\.-]+)\.([a-z\.]{2,})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:[0-9]+)?)([\/\w\-\.]*)*\/?$/;

    constructor(value: string) {
        super({ value });
    }

    public validate({ value }: DomainPrimitiveProperties<string>): void {
        if (!value.match(URL.URL_REGEX)) {
            throw new IllegalArgumentException('Invalid url');
        }
    }

    public static fromString(value: string) {
        return new URL(value);
    }
}
