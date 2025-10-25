import { NullAbleValue } from '@beincom/domain';
import { Url } from '@common/core/value-objects/url.value-object';

@NullAbleValue()
export class UserAvatarUrl extends Url {
    public static fromString(value?: string) {
        return new UserAvatarUrl(value || null);
    }
}
