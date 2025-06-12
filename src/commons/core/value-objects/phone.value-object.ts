import { IllegalArgumentException } from '@beincom/common';
import { DomainPrimitiveProperties, ValueObject } from '@beincom/domain';

export class Phone extends ValueObject<string> {
    private static readonly PHONE_REGEX =
        /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/;
    constructor(value: string) {
        super({ value });
    }

    public validate({ value }: DomainPrimitiveProperties<string>): void {
        if (!value.match(Phone.PHONE_REGEX)) {
            throw new IllegalArgumentException('Invalid phone number');
        }
    }

    public static fromString(value: string) {
        return new Phone(value);
    }
}
