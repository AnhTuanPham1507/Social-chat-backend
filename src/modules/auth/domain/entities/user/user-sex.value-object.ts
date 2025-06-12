import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from "@beincom/domain";

export enum USER_SEX {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}
  
export class UserSex extends ValueObject<USER_SEX> {
    constructor(props: ValueObjectProperties<USER_SEX>) {
    super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<USER_SEX>): void {}

    public static fromString(value: USER_SEX) {
        return new UserSex({ value });
    }
}
