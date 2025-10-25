import { Entity, UUID } from '@beincom/domain';
import { Email } from '@common/core/value-objects/email.value-object';

import { UserAvatarUrl } from './user-avatar.value-object';
import { UserPhone } from './user-phone.value-object';
import { USER_SEX, UserSex } from './user-sex.value-object';

interface IUserProps {
    email: Email;
    fullName: string;
    avatarUrl: UserAvatarUrl;
    phone: UserPhone;
    sex: UserSex;
}

export interface ICreateUserProps {
    id: UUID;
    email: string;
    fullName: string;
    phone: string;
    sex: USER_SEX;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

export class UserEntity extends Entity<UUID, IUserProps> {
    protected _id: UUID;

    public validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: any) {
        super(props);
    }

    public get email(): Email {
        return this._props['email'];
    }

    public get avatarUrl(): UserAvatarUrl {
        return this._props['avatarUrl'];
    }

    public get phone(): UserPhone {
        return this._props['phone'];
    }

    public get fullName(): string {
        return this._props['fullName'];
    }

    public get sex(): UserSex {
        return this._props['sex'];
    }
}
