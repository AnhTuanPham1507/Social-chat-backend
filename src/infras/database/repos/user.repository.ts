import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserModel } from '../models/user.model';

import { BaseRepository } from './base-repository';

@Injectable()
export class BaseUserRepository extends BaseRepository<UserModel> {
    constructor(
        @InjectRepository(UserModel)
        userRepository: Repository<UserModel>,
    ) {
        super(userRepository);
    }
}
