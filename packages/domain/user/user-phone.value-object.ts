import { NullAbleValue } from '@beincom/domain';
import { Phone } from '../common/phone.value-object';

@NullAbleValue()
export class UserPhone extends Phone {
    constructor(value: string) {
        super(value);
    }

    public static fromString(value?: string) {
        if (!value) {
            return null as any;
        }
        return new UserPhone(value);
    }
}
