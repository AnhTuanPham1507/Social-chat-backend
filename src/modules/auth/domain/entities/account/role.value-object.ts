import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from "@beincom/domain";

export enum ROLE {
    ADMIN = 'ADMIN',
    USER = 'USER',
}


export class Role extends ValueObject<ROLE> {
    constructor(props: ValueObjectProperties<ROLE>) {
    super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<ROLE>): void {}

    public static fromString(value: ROLE) {
        return new Role({ value });
    }
}