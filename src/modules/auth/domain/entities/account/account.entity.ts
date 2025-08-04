import { CreatedAt, DeletedAt, Entity, UpdatedAt, UUID } from '@beincom/domain';
import { Email } from '@common/core/value-objects/email.value-object';

import { UserEntity } from '../user/user.entity';

import {
    ACCOUNT_PROVIDER,
    AccountProvider,
} from './account-provider.value-object';
import { AvatarEntity } from './avatar.entity';
import { Password } from './password.value-object';
import { ROLE, Role } from './role.value-object';

interface IAccountProps {
    email?: Email;
    password?: Password;
    provider?: AccountProvider;
    role?: Role;
    avatar?: AvatarEntity;
    owner?: UserEntity;
}

export interface ICreateAccountProps {
    id?: UUID;
    email?: string;
    password?: string;
    provider?: ACCOUNT_PROVIDER;
    role?: ROLE;
    avatar?: AvatarEntity;
    owner?: UserEntity;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class AccountEntity extends Entity<UUID, IAccountProps> {
    protected _id: UUID;

    public validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: any) {
        super(props);
    }

    public get password(): Password {
        return this._props['password'];
    }

    public get email(): Email {
        return this._props['email'];
    }

    public get provider(): AccountProvider {
        return this._props['provider'];
    }

    public get role(): Role {
        return this._props['role'];
    }

    public get avatar(): AvatarEntity {
        return this._props['avatar'];
    }

    public get owner(): UserEntity {
        return this._props['owner'];
    }

    public static create(props: ICreateAccountProps) {
        const provider = AccountProvider.fromString(props.provider);
        // Only set password for LOCAL accounts or if explicitly provided for other providers
        let password;
        if (provider?.value === ACCOUNT_PROVIDER.LOCAL) {
            // Password is required for LOCAL accounts
            password = Password.fromString(props.password);
        } else if (props.password) {
            // Password is optional for non-LOCAL accounts
            password = Password.fromString(props.password);
        }

        return new AccountEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                ...props,
                provider,
                role: Role.fromString(props.role),
                email: Email.fromString(props.email),
                password,
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
        return new AccountEntity({
            id: new UUID(raw.id),
            props: {
                ...raw,
                email: Email.fromString(raw.email),
                password: raw.password
                    ? Password.fromString(raw.password)
                    : undefined,
                provider: AccountProvider.fromString(raw.provider),
                role: Role.fromString(raw.role),
                avatar: raw.avatar ? AvatarEntity.fromRaw(raw.avatar) : null,
                owner: raw.owner ? UserEntity.fromRaw(raw.owner) : null,
            },
            createdAt: CreatedAt.fromDateString(raw.createdAt),
            updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
            deletedAt: raw.deletedAt
                ? DeletedAt.fromDateString(raw.deletedAt)
                : null,
        });
    }
}
