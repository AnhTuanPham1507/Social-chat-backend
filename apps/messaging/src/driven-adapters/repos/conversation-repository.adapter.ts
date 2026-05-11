import { Injectable } from '@nestjs/common';

import { ConversationEntity, CONVERSATION_TYPE } from '@social-chat/domain';
import { BaseConversationRepository } from '@social-chat/infrastructure';

import { IConversationRepository } from '@application/contracts/conversation-repository.contract';
import { ConversationPersistenceMapper } from './mappers/conversation-persistence.mapper';

@Injectable()
export class ConversationRepo implements IConversationRepository {
    constructor(private readonly _repo: BaseConversationRepository) {}

    public async insert(conversation: ConversationEntity): Promise<void> {
        const model = ConversationPersistenceMapper.fromEntityToModel(conversation);
        await this._repo.create(model);
    }

    public async findById(id: string): Promise<ConversationEntity | null> {
        const model = await this._repo.findOneWithOptions({
            where: { id },
            relations: ['members'],
        });

        return model ? ConversationPersistenceMapper.fromModelToEntity(model) : null;
    }

    public async findExistingDM(
        userIdA: string,
        userIdB: string,
    ): Promise<ConversationEntity | null> {
        const [lower, higher] = [userIdA, userIdB].sort();

        const model = await this._repo.findOneWithOptions({
            where: {
                type: CONVERSATION_TYPE.DIRECT,
                lowerUserId: lower,
                higherUserId: higher,
            },
            relations: ['members'],
        });

        return model ? ConversationPersistenceMapper.fromModelToEntity(model) : null;
    }
}
