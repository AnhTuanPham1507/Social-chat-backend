import { UserSex } from '../../../core/enums/user-sex.enum';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { UserProvider } from 'src/core/enums/user-provider.enum';

@Entity({ name: 'user' })
export class UserModel {
    @PrimaryColumn()
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

    @Column({
        type: 'enum', enum: UserProvider, default: UserProvider.LOCAL
    })
    provider: UserProvider;
}
