import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';

export enum ACCOUNT_PROVIDER {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
}

export class AccountProvider extends ValueObject<ACCOUNT_PROVIDER> {
    constructor(props: ValueObjectProperties<ACCOUNT_PROVIDER>) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<ACCOUNT_PROVIDER>): void {}

    public static fromString(value: ACCOUNT_PROVIDER) {
        return new AccountProvider({ value });
    }
}
