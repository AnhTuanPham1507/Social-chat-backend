import { v7 as uuidv7 } from 'uuid';

import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { MESSAGE_CONTENT_MAX_LENGTH } from './message.constants';
import { MessageSentEvent } from './events/message-sent.event';

interface MessageProps {
    conversationId: UUID;
    senderId: UUID;
    content: string;
    serverTs: Date;
}

export interface SendMessageInput {
    conversationId: UUID;
    senderId: UUID;
    content: string;
}

export interface ReconstituteMessageProps {
    id: UUID;
    conversationId: UUID;
    senderId: UUID;
    content: string;
    serverTs: Date;
}

/**
 * Message aggregate root.
 *
 * Sibling aggregate to Conversation — references it only by `conversationId`.
 * The conversation enforces membership; this aggregate enforces content
 * invariants and immutability of the ordering signal `serverTs`.
 *
 * Identity is UUIDv7 (time-ordered) so that the `_id` index gives a useful
 * approximate-time sort even if `serverTs` is unavailable, and writes
 * cluster on the right edge of the B-tree.
 */
export class MessageEntity extends AggregateRoot<MessageProps> {
    private constructor(props: MessageProps, id: UUID) {
        super(props, id);
        // serverTs is the canonical timestamp; collapse base-class createdAt/updatedAt onto it.
        this.setTimestamps(props.serverTs, props.serverTs);
    }

    /**
     * Factory for a newly-sent message. `serverTs` is supplied by the
     * application service via the injected `IClock`, never by the
     * domain layer or the client.
     */
    static send(input: SendMessageInput, serverTs: Date): MessageEntity {
        const content = input.content.trim();
        if (content.length === 0) {
            throw new Error('Message content cannot be empty');
        }
        if (content.length > MESSAGE_CONTENT_MAX_LENGTH) {
            throw new Error(
                `Message content cannot exceed ${MESSAGE_CONTENT_MAX_LENGTH} characters`,
            );
        }

        const messageId = uuidv7();
        const message = new MessageEntity(
            {
                conversationId: input.conversationId,
                senderId: input.senderId,
                content,
                serverTs,
            },
            messageId,
        );

        message.addDomainEvent(
            new MessageSentEvent(
                messageId,
                input.conversationId,
                input.senderId,
                content,
                serverTs,
            ),
        );

        return message;
    }

    static reconstitute(props: ReconstituteMessageProps): MessageEntity {
        return new MessageEntity(
            {
                conversationId: props.conversationId,
                senderId: props.senderId,
                content: props.content,
                serverTs: props.serverTs,
            },
            props.id,
        );
    }

    get conversationId(): UUID {
        return this._props.conversationId;
    }

    get senderId(): UUID {
        return this._props.senderId;
    }

    get content(): string {
        return this._props.content;
    }

    get serverTs(): Date {
        return this._props.serverTs;
    }
}
