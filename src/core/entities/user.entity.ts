import { UserSex } from "src/common/enums/user.enum";

export class UserEntity {
    private id: string;
    private fullName: string;
    private email: string;
    private phone: string;
    private password: string;
    private sex: UserSex;

    constructor(id: string, fullName: string, email: string, phone, password: string, sex: UserSex) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.sex = sex;
    }
}