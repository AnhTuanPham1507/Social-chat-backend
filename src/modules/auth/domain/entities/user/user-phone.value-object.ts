import { NullAbleValue } from '@beincom/domain';
import { Phone } from '@common/core/value-objects/phone.value-object';

@NullAbleValue()
export class UserPhone extends Phone {
    public static fromString(value?: string) {
        return new UserPhone(value || null);
    }
}
