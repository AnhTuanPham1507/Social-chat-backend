import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/core/entities/user.entity';
import { BaseRepo } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model';
import { IUserRepo } from 'src/core/interfaces/user-repo.interface';

@Injectable()
export class UserRepo extends BaseRepo<UserEntity> implements IUserRepo {
    constructor(
        @InjectRepository(UserModel)
        protected userRepo: Repository<UserEntity>,
    ) {
        super(userRepo);
    }
}
