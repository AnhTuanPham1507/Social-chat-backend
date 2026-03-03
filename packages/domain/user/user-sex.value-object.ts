import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';
import { IllegalArgumentException } from '@beincom/common';

export enum USER_SEX {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    UNKNOWN = 'UNKNOWN',
}

export class UserSex extends ValueObject<USER_SEX> {
    constructor(props: ValueObjectProperties<USER_SEX>) {
        super(props);
    }

    public validate({ value }: DomainPrimitiveProperties<USER_SEX>): void {
        if (!Object.values(USER_SEX).includes(value)) {
            throw new IllegalArgumentException('Invalid user sex');
        }
    }

    public static fromString(value?: USER_SEX) {
        return new UserSex({ value: value || USER_SEX.UNKNOWN });
    }
}
