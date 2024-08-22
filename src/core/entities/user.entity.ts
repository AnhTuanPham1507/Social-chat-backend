import { UserSex } from '../../core/enums/user.enum';
import { Role } from '../enums/role.enum';
import { Entity } from '../interfaces/base-entity.interface';
export class UserEntity extends Entity {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    sex: UserSex;
    role: Role;

    constructor(
        role: Role,
        fullName: string,
        email: string,
        phone,
        password: string,
        sex: UserSex,
        id?: string,
    ) {
        super(id);

        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.sex = sex;
        this.role = role;
    }
}
