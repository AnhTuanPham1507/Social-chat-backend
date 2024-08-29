import { UserSex } from '../../../core/enums/user-sex.enum';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { UserProvider } from '../../../core/enums/user-provider.enum';
import { Role } from '../../../core/enums/role.enum';
import { BaseModel } from './base.model';
import { AssetModel } from './asset.model';

@Entity({ name: 'user' })
@Index(['email', 'provider'], { unique: true })
export class UserModel extends BaseModel {
    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 11, unique: true, nullable: true })
    phone: string | null;

    @Column({ length: 255, nullable: true })
    password: string | null;

    @Column({ length: 50 })
    fullName: string;

    @Column({ type: 'enum', enum: UserSex, default: UserSex.OTHER })
    sex: UserSex;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({
        type: 'enum',
        enum: UserProvider,
    })
    provider: UserProvider;

    @OneToOne(() => AssetModel, { nullable: true })
    @JoinColumn()
    avatar: AssetModel | null;
}
