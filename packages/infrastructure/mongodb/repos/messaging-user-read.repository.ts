import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    MessagingUserRead,
    MessagingUserReadDocument,
} from '../schemas/messaging-user-read.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class MessagingUserReadMongoRepository extends BaseMongoRepository<MessagingUserReadDocument> {
    constructor(
        @InjectModel(MessagingUserRead.name) model: Model<MessagingUserReadDocument>,
    ) {
        super(model);
    }
}
