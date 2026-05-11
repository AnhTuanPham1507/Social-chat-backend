import { Injectable } from '@nestjs/common';

import { MessageEntity } from '@social-chat/domain';
import { MessageMongoRepository } from '@social-chat/infrastructure';

import { IMessageRepository } from '@application/contracts/message-repository.contract';
import { MessagePersistenceMapper } from './mappers/message-persistence.mapper';

@Injectable()
export class MessageRepo implements IMessageRepository {
    constructor(private readonly _repo: MessageMongoRepository) {}

    public async insert(message: MessageEntity): Promise<void> {
        const doc = MessagePersistenceMapper.fromEntityToDoc(message);
        await this._repo.insert(doc);
    }
}
