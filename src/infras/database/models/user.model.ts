import { BaseModel } from '@infras/database/models/base.model';
import { USER_SEX } from '@modules/auth/domain/entities/user/user-sex.value-object';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class UserModel extends BaseModel {
    @Column('varchar', { length: 255 })
    fullName: string;

    @Column('varchar', { length: 255, unique: true })
    email: string;

    @Column('varchar', { length: 20, unique: true, nullable: true })
    phone?: string;

    @Column('enum', { enum: USER_SEX, default: USER_SEX.UNKNOWN })
    sex?: USER_SEX;

    @Column('text', { nullable: true })
    avatarUrl?: string;
}
