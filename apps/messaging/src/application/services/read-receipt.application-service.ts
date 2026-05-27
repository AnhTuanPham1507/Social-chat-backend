import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { CLOCK_TOKEN, IClock } from '@social-chat/domain';
import { MessageReadEvent } from '@social-chat/common';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../contracts/conversation-repository.contract';
import {
    IParticipantStateRepository,
    PARTICIPANT_STATE_REPO_TOKEN,
} from '../contracts/participant-state-repository.contract';
import {
    IWsPushPublisher,
    WS_PUSH_PUBLISHER_TOKEN,
} from '../contracts/ws-push-publisher.contract';

export const READ_RECEIPT_APPLICATION_SERVICE_TOKEN = Symbol(
    'READ_RECEIPT_APPLICATION_SERVICE_TOKEN',
);

export interface IReadReceiptApplicationService {
    ackRead(
        currentUserId: string,
        conversationId: string,
        lastReadMessageId: string,
    ): Promise<void>;
}

/**
 * Orchestrates read-receipt acks from clients.
 *
 * Pipeline:
 *   1. Validate conversation exists + caller is a member (trust boundary)
 *   2. Server-stamp `readAt` via IClock (never trust client clock — see 6.2)
 *   3. Forward-only `$max` upsert on participant_state
 *   4. If $max degenerated to a no-op (stale/duplicate ack) → skip broadcast
 *   5. Broadcast `message:read` on conversation:{C} — every online member
 *      updates their reader-avatar rail; offline members recover on next
 *      conversation-open via slice 5's bulk fetch
 *
 * Broadcast (not unicast): the UI model is reader-avatars-on-rail, every
 * member's view is the same, so a single publishToConversation suffices.
 * Trade-off: O(online members) WS pushes per advance; acceptable given
 * each push is ~100 bytes and broadcast is unavoidable for this UI.
 */
@Injectable()
export class ReadReceiptApplicationService
    implements IReadReceiptApplicationService
{
    constructor(
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
        @Inject(PARTICIPANT_STATE_REPO_TOKEN)
        private readonly _participantStateRepo: IParticipantStateRepository,
        @Inject(WS_PUSH_PUBLISHER_TOKEN)
        private readonly _wsPushPublisher: IWsPushPublisher,
        @Inject(CLOCK_TOKEN)
        private readonly _clock: IClock,
    ) {}

    async ackRead(
        currentUserId: string,
        conversationId: string,
        lastReadMessageId: string,
    ): Promise<void> {
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

        const readAt = this._clock.now();

        const { advanced } = await this._participantStateRepo.advanceReadWatermark(
            conversationId,
            currentUserId,
            lastReadMessageId,
            readAt,
        );

        if (!advanced) {
            // Stale/duplicate ack — watermark didn't move. Suppress
            // broadcast to avoid re-fanout of identical state to all
            // online members of a possibly-large group.
            return;
        }

        const wsEvent: MessageReadEvent = {
            event: 'message:read',
            conversationId,
            userId: currentUserId,
            lastReadMessageId,
            lastReadAt: readAt.toISOString(),
        };

        await this._wsPushPublisher.publishToConversation(
            conversationId,
            wsEvent,
        );
    }
}
