import { Injectable } from '@nestjs/common';

import { ParticipantStateMongoRepository } from '@social-chat/infrastructure';

import {
    AdvanceReadResult,
    IParticipantStateRepository,
    ParticipantStateModel,
} from '../../application/contracts/participant-state-repository.contract';

@Injectable()
export class ParticipantStateRepo implements IParticipantStateRepository {
    constructor(
        private readonly _repo: ParticipantStateMongoRepository,
    ) {}

    async advanceReadWatermark(
        conversationId: string,
        userId: string,
        messageId: string,
        readAt: Date,
    ): Promise<AdvanceReadResult> {
        const prev = await this._repo.advanceReadWatermark(
            conversationId,
            userId,
            messageId,
            readAt,
        );

        // `$max` is a no-op when incoming ≤ stored. Detect by string
        // comparison — UUIDv7 lex order == time order, so this is sound.
        const advanced =
            !prev?.lastReadMessageId || prev.lastReadMessageId < messageId;

        return { prev, advanced };
    }

    async findByConversation(
        conversationId: string,
    ): Promise<ParticipantStateModel[]> {
        return this._repo.findByConversation(conversationId);
    }
}
