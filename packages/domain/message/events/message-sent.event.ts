import { DomainEvent } from '../../core/domain-event.base';

export class MessageSentEvent extends DomainEvent {
    constructor(
        readonly messageId: string,
        readonly conversationId: string,
        readonly senderId: string,
        readonly content: string,
        readonly serverTs: Date,
    ) {
        super(messageId);
    }

    get eventName(): string {
        return 'message.sent';
    }
}
