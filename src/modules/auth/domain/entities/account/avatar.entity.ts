import {
    CreatedAt,
    DeletedAt,
    Entity,
    EntityProps,
    UpdatedAt,
    UUID,
} from '@beincom/domain';
import { URL } from '@common/core/value-objects/url.value-object';

interface IAvatarProps {
    url?: URL;
}

export interface ICreateAvatarProps {
    id?: UUID;
    url?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class AvatarEntity extends Entity<UUID, IAvatarProps> {
    protected _id: UUID;

    public validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: EntityProps<UUID, IAvatarProps>) {
        super(props);
    }

    public get url(): URL {
        return this._props['url'];
    }

    public static create(props: ICreateAvatarProps) {
        return new AvatarEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                ...props,
                url: new URL(props.url),
            },
            createdAt: CreatedAt.fromDateString(
                props.createdAt
                    ? props.createdAt.toISOString()
                    : new Date().toISOString(),
            ),
            updatedAt: UpdatedAt.fromDateString(
                props.updatedAt
                    ? props.updatedAt.toISOString()
                    : new Date().toISOString(),
            ),
            deletedAt: props.deletedAt
                ? DeletedAt.fromDateString(props.deletedAt.toISOString())
                : null,
        });
    }

    public static fromRaw(raw: any) {
        return new AvatarEntity({
            id: new UUID(raw.id),
            props: {
                ...raw,
                url: new URL(raw.url),
            },
            createdAt: CreatedAt.fromDateString(raw.createdAt),
            updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
            deletedAt: raw.deletedAt
                ? DeletedAt.fromDateString(raw.deletedAt)
                : null,
        });
    }
}
