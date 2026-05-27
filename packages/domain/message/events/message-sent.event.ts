import { DomainEvent } from '../../core/domain-event.base';

export class MessageSentEvent extends DomainEvent {
    static readonly EVENT_NAME = 'message.sent';

    constructor(
        readonly messageId: string,
        readonly conversationId: string,
        readonly senderId: string,
        readonly content: string,
        readonly attachmentKeys: string[],
        readonly serverTs: Date,
    ) {
        super(messageId);
    }

    get eventName(): string {
        return MessageSentEvent.EVENT_NAME;
    }
}
