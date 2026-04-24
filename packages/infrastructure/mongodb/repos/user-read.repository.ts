import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRead, UserReadDocument } from '../schemas/user-read.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class UserReadMongoRepository extends BaseMongoRepository<UserReadDocument> {
    constructor(
        @InjectModel(UserRead.name) model: Model<UserReadDocument>,
    ) {
        super(model);
    }
}
