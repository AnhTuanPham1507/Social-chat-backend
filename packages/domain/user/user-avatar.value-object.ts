import { NullAbleValue } from '@beincom/domain';
import { Url } from '../common/url.value-object';

@NullAbleValue()
export class UserAvatarUrl extends Url {
    constructor(value: string) {
        super(value);
    }

    public static fromString(value?: string) {
        if (!value) {
            return null as any;
        }
        return new UserAvatarUrl(value);
    }
}
