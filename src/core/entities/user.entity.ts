import { UserSex } from '../enums/user-sex.enum';
import { Role } from '../enums/role.enum';
import { Entity } from '../interfaces/base-entity.interface';
import { UserProvider } from '../enums/user-provider.enum';
import { AssetEntity } from './asset.entity';
export interface IUserProps {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    sex?: UserSex;
    provider?: UserProvider;
    avatar?: AssetEntity;
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
    avatar?: AssetEntity;

    private constructor(id?: string, props?: IUserProps) {
        super(id);

        if (props) {
            this.fullName = props.fullName;
            this.email = props.email;
            this.phone = props.phone;
            this.password = props.password;
            this.sex = props.sex;
            this.provider = props.provider;
            this.avatar = props.avatar;
            this.createdAt = props.createdAt;
            this.updatedAt = props.updatedAt;
            this.deletedAt = props.deletedAt;
            this.role = Role.USER;
        }
    }

    static createLocalUser(id?: string, props?: IUserProps) {
        return new UserEntity(id, { ...props, provider: UserProvider.LOCAL });
    }

    static createGoogleUser(id?: string, props?: IUserProps) {
        return new UserEntity(id, {...props, provider: UserProvider.GOOGLE });
    }
}
