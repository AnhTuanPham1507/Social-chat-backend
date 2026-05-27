import { IntegrationEvent } from '../base/integration-event.base';

/**
 * Command published by the realtime-gateway when a client sends a message.
 *
 * Semantically a *command* (imperative intent), but transports over the same
 * Kafka envelope as integration events — so it extends `IntegrationEvent` to
 * reuse `eventId` / `occurredOn` / `eventVersion`.
 *
 * Topic strategy: all messaging commands share ONE topic `messaging.commands`,
 * with `commandType` as the discriminator. Partition key is `conversationId`
 * (preserves per-conversation ordering).
 *
 * Payload shape covers both text and attachment-only messages. The
 * composition invariant ("must carry content OR attachments") is enforced
 * in the domain entity, not on the wire — the wire layer only validates
 * field shapes.
 *
 * Idempotency: consumer dedupes on `messageId`. A client retry produces a new
 * envelope (new `eventId`) but the same `messageId`, so the consumer treats
 * the second insert as a no-op.
 */
export class SendMessageCommand extends IntegrationEvent {
    static readonly TOPIC = 'messaging.commands';
    static readonly COMMAND_TYPE = 'send-message';

    readonly commandType: 'send-message' = 'send-message';
    readonly messageId: string;
    readonly conversationId: string;
    readonly senderId: string;
    readonly content: string;
    readonly attachmentKeys: string[];
    readonly clientSentAt: number;
    readonly gatewayReceivedAt: number;
    readonly correlationId: string;
    readonly traceparent?: string;

    constructor(input: {
        messageId: string;
        conversationId: string;
        senderId: string;
        content: string;
        attachmentKeys?: string[];
        clientSentAt: number;
        gatewayReceivedAt: number;
        correlationId: string;
        traceparent?: string;
    }) {
        super();
        this.messageId = input.messageId;
        this.conversationId = input.conversationId;
        this.senderId = input.senderId;
        this.content = input.content;
        this.attachmentKeys = input.attachmentKeys ?? [];
        this.clientSentAt = input.clientSentAt;
        this.gatewayReceivedAt = input.gatewayReceivedAt;
        this.correlationId = input.correlationId;
        this.traceparent = input.traceparent;
    }
}
