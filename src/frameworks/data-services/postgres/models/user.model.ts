import { UserSex } from 'src/core/enums/user.enum';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user')
export class UserModel {
    @PrimaryColumn('id')
    id: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 11, unique: true })
    phone: string;

    @Column({ length: 255 })
    password: string;

    @Column({ length: 50 })
    fullName: string;

    @Column({ type: 'enum', enum: UserSex })
    sex: UserSex;
}
