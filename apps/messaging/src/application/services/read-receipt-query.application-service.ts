import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../contracts/conversation-repository.contract';
import {
    IParticipantStateRepository,
    PARTICIPANT_STATE_REPO_TOKEN,
    ParticipantStateModel,
} from '../contracts/participant-state-repository.contract';

export const READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN = Symbol(
    'READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN',
);

export interface IReadReceiptQueryApplicationService {
    listForConversation(
        currentUserId: string,
        conversationId: string,
    ): Promise<ParticipantStateModel[]>;
}

/**
 * Bulk-fetch of participant read-state for a conversation.
 *
 * Used by clients on conversation-open (or WS reconnect) to bootstrap the
 * "who has read what" map. Heals any dropped `message:read` broadcasts —
 * Mongo `participant_state` is the source of truth, the broadcast is just
 * the fast notification layer.
 *
 * Bounded result: N rows where N ≤ conversation.member-cap (1024). No
 * pagination — clients render once and incrementally patch via WS.
 */
@Injectable()
export class ReadReceiptQueryApplicationService
    implements IReadReceiptQueryApplicationService
{
    constructor(
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
        @Inject(PARTICIPANT_STATE_REPO_TOKEN)
        private readonly _participantStateRepo: IParticipantStateRepository,
    ) {}

    async listForConversation(
        currentUserId: string,
        conversationId: string,
    ): Promise<ParticipantStateModel[]> {
        const conversation = await this._conversationRepo.findById(
            conversationId,
        );
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }
        if (!conversation.hasMember(currentUserId)) {
            throw new ForbiddenException(
                'You are not a member of this conversation',
            );
        }

        return this._participantStateRepo.findByConversation(conversationId);
    }
}
