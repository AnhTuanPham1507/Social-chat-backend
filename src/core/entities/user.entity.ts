import { UserSex } from '../enums/user-sex.enum';
import { Role } from '../enums/role.enum';
import { Entity } from '../interfaces/base-entity.interface';
export interface IUserProps {
    role?: Role,
    fullName?: string,
    email?: string,
    phone?: string,
    password?: string,
    sex?: UserSex,
}
export class UserEntity extends Entity {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    sex?: UserSex;
    role?: Role;

    constructor(
        id?: string,
        props?: IUserProps,
    ) {
        super(id);

        if (props) {
            this.fullName = props.fullName;
            this.email = props.email;
            this.phone = props.phone;
            this.password = props.password;
            this.sex = props.sex;
            this.role = props.role;
        }
    }
}
