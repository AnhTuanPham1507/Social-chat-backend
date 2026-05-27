import { DomainEvent } from '../../core/domain-event.base';
import { CONVERSATION_TYPE } from '../conversation-type.enum';

export class ConversationCreatedEvent extends DomainEvent {
    static readonly EVENT_NAME = 'conversation.created';

    constructor(
        readonly conversationId: string,
        readonly type: CONVERSATION_TYPE,
        readonly memberIds: string[],
        readonly creatorId: string,
    ) {
        super(conversationId);
    }

    get eventName(): string {
        return ConversationCreatedEvent.EVENT_NAME;
    }
}
