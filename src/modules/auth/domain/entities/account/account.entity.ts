import { ACCOUNT_PROVIDER, AccountProvider } from './account-provider.value-object';
import { ROLE, Role } from './role.value-object';
import { UserEntity } from '../user/user.entity';
import { CreatedAt, DeletedAt, Entity, EntityProps, UpdatedAt, UUID } from '@beincom/domain';
import { Password } from './password.value-object';
import { Email } from '@commons/core/value-objects/email.value-object';
import { AvatarEntity } from './avatar.entity';

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

    validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: EntityProps<UUID, IAccountProps>) {
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
    

    static create(props: ICreateAccountProps) {
        return new AccountEntity({ 
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                ...props,
                provider: AccountProvider.fromString(props.provider),
                role: Role.fromString(props.role),
                email: Email.fromString(props.email),
                password: Password.fromString(props.password),
            },
            createdAt: CreatedAt.fromDateString(props.createdAt ? props.createdAt.toISOString() : new Date().toISOString()),
            updatedAt: UpdatedAt.fromDateString(props.updatedAt ? props.updatedAt.toISOString() : new Date().toISOString()),
            deletedAt: props.deletedAt ? DeletedAt.fromDateString(props.deletedAt.toISOString()) : null
        });
    }

    static fromRaw(raw: any) {
        return new AccountEntity({
           id: new UUID(raw.id),
           props: {
                ...raw,
                email: Email.fromString(raw.email),
                password: Password.fromString(raw.password),
                provider: AccountProvider.fromString(raw.provider),
                role: Role.fromString(raw.role),
                avatar: raw.avatar ? AvatarEntity.fromRaw(raw.avatar) : null,
                owner: raw.owner ? UserEntity.fromRaw(raw.owner) : null
            },
            createdAt: CreatedAt.fromDateString(raw.createdAt),
            updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
            deletedAt: raw.deletedAt ? DeletedAt.fromDateString(raw.deletedAt) : null
        });
    }
}
