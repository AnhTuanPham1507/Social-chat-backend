import { UserSex } from '../enums/user-sex.enum';
import { Role } from '../enums/role.enum';
import { Entity } from '../interfaces/base-entity.interface';
import { UserProvider } from '../enums/user-provider.enum';
import { AssetEntity, IAssetProps } from './asset.entity';
import { BadRequestException } from '@nestjs/common';
export interface IUserProps {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    sex?: UserSex;
    provider?: UserProvider;
    avatar?: AssetEntity | IAssetProps;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
export class UserEntity extends Entity {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    sex?: UserSex;
    role?: Role;
    provider?: UserProvider;
    avatar?: AssetEntity | IAssetProps;

    private constructor(id?: string, props?: IUserProps) {
        super(id);

        if (props) {
            this.fullName = props.fullName;
            this.email = props.email;
            this.phone = props.phone;
            this.password = props.password;
            this.sex = props.sex;
            this.provider = props.provider;
            this.createdAt = props.createdAt;
            this.updatedAt = props.updatedAt;
            this.deletedAt = props.deletedAt;
            this.role = Role.USER;
            if(props.avatar){
                if (props.avatar instanceof AssetEntity) {
                    props.avatar.ownerId = this.id;
                    this.avatar = props.avatar;
                } else {
                    this.avatar = new AssetEntity(null, {
                        ownerId: this.id,
                        ...props.avatar,
                    });
                }
            }
            
        }
    }

    static createLocalUser(id?: string, props?: IUserProps) {
        if(typeof props.password === 'string' && props.password.length >= 8){
            return new UserEntity(id, { ...props, provider: UserProvider.LOCAL });
        }

        throw new BadRequestException(
            'Mật khẩu không hợp lệ',
        );
    }

    static createGoogleUser(id?: string, props?: IUserProps) {
        if (props.password === undefined || props.password === null) {
            return new UserEntity(id, { ...props, provider: UserProvider.GOOGLE });
        }
        throw new BadRequestException(
            'Tài khoản chỉ có thể đăng nhập thông qua Google',
        );
    }
}
