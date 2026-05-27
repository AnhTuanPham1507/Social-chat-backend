import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MessageSentEvent } from '@social-chat/domain';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '@application/contracts/conversation-repository.contract';

/**
 * Denormalises the most recent message timestamp onto the conversation row
 * so the inbox list can sort by "last active" without a per-row query into
 * the messages collection.
 *
 * Listens to the domain MessageSentEvent (in-process EventEmitter, fired
 * after the message is persisted in the messaging app-service). The repo
 * does a conditional UPDATE so out-of-order arrivals do not roll the
 * activity backwards.
 *
 * Failures are logged but not rethrown — the message itself is already
 * persisted and the WS push has already happened. A stale lastActivityAt
 * is recoverable (a future write will fix it), so we don't block the
 * publishAll() chain on this side-effect.
 */
@Injectable()
export class ConversationActivityListener {
    private readonly _logger = new Logger(ConversationActivityListener.name);

    constructor(
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
    ) {}

    @OnEvent(MessageSentEvent.EVENT_NAME)
    public async handle(event: MessageSentEvent): Promise<void> {
        try {
            await this._conversationRepo.bumpLastActivityAt(
                event.conversationId,
                event.serverTs,
            );
        } catch (err) {
            this._logger.error(
                `Failed to bump lastActivityAt for ${event.conversationId}: ` +
                    `${err instanceof Error ? err.message : err}`,
            );
        }
    }
}
