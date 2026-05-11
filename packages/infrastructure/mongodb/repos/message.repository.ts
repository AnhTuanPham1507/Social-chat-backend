import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Message, MessageDocument } from '../schemas/message.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class MessageMongoRepository extends BaseMongoRepository<MessageDocument> {
    constructor(@InjectModel(Message.name) model: Model<MessageDocument>) {
        super(model);
    }
}
