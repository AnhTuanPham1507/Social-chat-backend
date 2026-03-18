import { NullAbleValue, ValueObject, DomainPrimitiveProperties } from '@beincom/domain';

/**
 * Value object for user avatar.
 * Stores an object key (e.g., "avatars/uuid-123.jpg") rather than a full URL.
 * Client SDK combines CDN base URL + key to construct the full image URL.
 */
@NullAbleValue()
export class UserAvatarUrl extends ValueObject<string> {
    constructor(value: string) {
        super({ value });
    }

    public validate({ value }: DomainPrimitiveProperties<string>): void {
        // No URL validation needed - stores object key, not a full URL
    }

    public static fromString(value?: string) {
        if (!value) {
            return null as any;
        }
        return new UserAvatarUrl(value);
    }
}
