import { CreatedAt, DeletedAt, UpdatedAt, UUID } from '@beincom/domain';
import { IBaseMapper } from '@common/core/base-mapper.interface';
import { Email } from '@common/core/value-objects/email.value-object';
import { UserModel } from '@infras/database/models';
import { UserAvatarUrl } from '@modules/auth/domain/entities/user/user-avatar.value-object';
import { UserPhone } from '@modules/auth/domain/entities/user/user-phone.value-object';
import { UserSex } from '@modules/auth/domain/entities/user/user-sex.value-object';
import {
    ICreateUserProps,
    UserEntity,
} from '@modules/auth/domain/entities/user/user.entity';
import { Injectable } from '@nestjs/common';

export const USER_MAPPER_TOKEN = 'USER_MAPPER_TOKEN';

export interface IUserMapper
    extends IBaseMapper<UserEntity, UserModel, Partial<ICreateUserProps>> {}

@Injectable()
export class UserMapper implements IUserMapper {
    public fromEntityToModel(entity: UserEntity): Partial<UserModel> {
        const model: Partial<UserModel> = {
            id: entity.id.value,
            fullName: entity.fullName,
            email: entity.email.value,
            phone: entity.phone.value,
            sex: entity.sex.value,
            avatarUrl: entity.avatarUrl.value,
            createdAt: entity.createdAt.value,
            updatedAt: entity.updatedAt.value,
            deletedAt: entity.deletedAt.value,
        };

        return model;
    }

    public fromPropsToEntity(props: Partial<ICreateUserProps>): UserEntity {
        return new UserEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                fullName: props.fullName,
                sex: UserSex.fromString(props.sex),
                email: Email.fromString(props.email),
                phone: UserPhone.fromString(props.phone),
                avatarUrl: UserAvatarUrl.fromString(props.avatarUrl),
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
}
