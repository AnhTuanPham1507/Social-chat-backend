import {
    CreatedAt,
    DeletedAt,
    Entity,
    EntityProps,
    UpdatedAt,
    UUID,
} from '@beincom/domain';
import { Email } from '@common/core/value-objects/email.value-object';

import { Phone } from '../../../../../common/core/value-objects/phone.value-object';

import { USER_SEX, UserSex } from './user-sex.value-object';

interface IUserProps {
    fullName?: string;
    email?: Email;
    phone?: Phone;
    sex?: UserSex;
}

export interface ICreateUserProps {
    id?: UUID;
    fullName?: string;
    email?: string;
    phone?: string;
    sex?: USER_SEX;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class UserEntity extends Entity<UUID, IUserProps> {
    protected _id: UUID;

    public validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: EntityProps<UUID, IUserProps>) {
        super(props);
    }

    public static create(props: ICreateUserProps) {
        return new UserEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                ...props,
                sex: UserSex.fromString(props.sex),
                email: Email.fromString(props.email),
                phone: Phone.fromString(props.phone),
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
        return new UserEntity({
            id: new UUID(raw.id),
            props: {
                ...raw,
                sex: UserSex.fromString(raw.sex),
                email: Email.fromString(raw.email),
                phone: Phone.fromString(raw.phone),
            },
            createdAt: CreatedAt.fromDateString(raw.createdAt),
            updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
            deletedAt: raw.deletedAt
                ? DeletedAt.fromDateString(raw.deletedAt)
                : null,
        });
    }
}
