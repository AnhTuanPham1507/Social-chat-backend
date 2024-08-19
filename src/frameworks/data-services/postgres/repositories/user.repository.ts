import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/core/entities/user.entity';
import { BaseRepo } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model';

@Injectable()
export class UserRepo extends BaseRepo<UserModel> {
    constructor(
        @InjectRepository(UserModel)
        protected userRepo: Repository<UserModel>,
    ) {
        super(userRepo);
    }
}
