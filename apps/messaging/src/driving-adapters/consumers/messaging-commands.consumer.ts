import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Kafka } from 'kafkajs';

import {
    DlqClassification,
    KafkaIntegrationConsumer,
    KAFKA_CLIENT_TOKEN,
    KafkaProducerService,
    PermanentError,
} from '@social-chat/infrastructure';
import {
    MessageRejectedReason,
    SendMessageCommand,
} from '@social-chat/common';

import {
    IMessageRepository,
    MESSAGE_REPO_TOKEN,
} from '@application/contracts/message-repository.contract';
import {
    IMessageApplicationService,
    MESSAGE_APPLICATION_SERVICE_TOKEN,
} from '@application/services/message.application-service';
import {
    IWsPushPublisher,
    WS_PUSH_PUBLISHER_TOKEN,
} from '@application/contracts/ws-push-publisher.contract';
import { MESSAGING_COMMANDS_GROUP_ID } from '../../constants/messaging.constant';

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

/**
 * Raised when a duplicate-key error on insert turns out to be a collision
 * (different sender already owns the messageId) rather than a legitimate
 * retry. Causes: true UUID v7 collision (astronomically rare) or a malicious
 * replay where another client reused someone else's messageId. Retrying does
 * not help — the existing row is permanent state. The base class catches a
 * wrapping `PermanentError` and routes the message to the DLQ; this class
 * publishes `message:rejected` to the sender via `onDeadLettered`.
 */
export class MessageIdCollisionError extends Error {
    constructor(
        readonly messageId: string,
        readonly conversationId: string,
        readonly attemptedSenderId: string,
        readonly existingSenderId: string | null,
    ) {
        super(
            `messageId collision: messageId=${messageId} conversationId=${conversationId} ` +
                `attemptedSenderId=${attemptedSenderId} existingSenderId=${existingSenderId ?? '<not found in conversation>'}`,
        );
        this.name = 'MessageIdCollisionError';
    }
}

/**
 * Consumes commands published by realtime-gateway on `messaging.commands`.
 *
 * Idempotency contract:
 *   - At-least-once delivery from Kafka + idempotent insert at Mongo
 *     (unique `_id` index) = exactly-once effect.
 *   - A duplicate-key error is NOT silently swallowed. The consumer
 *     re-reads the existing row to distinguish:
 *       (a) same sender — legitimate retry → no-op
 *       (b) different sender — collision/replay → PermanentError → DLQ
 *
 * Error-handling boundaries (delegated to base class):
 *   - Domain-permanent (collision, conversation-not-found, sender-not-member,
 *     malformed content): thrown as `PermanentError` or classified via
 *     `classifyError` → straight to DLQ, sender notified via `onDeadLettered`.
 *   - Transient (Mongo/Redis blip, network timeout): bubbled raw → base
 *     class retries 3x with 1s/2s/4s backoff → if still failing, DLQ as
 *     `transient-exhausted`, same sender notification.
 *
 * The `_handleDuplicateKey` "findById returned null" branch deliberately
 * bubbles the raw dup-key error: that signals the colliding row may exist
 * in another conversation OR a primary/secondary read lag — both worth a
 * brief retry. After retries exhausted, the base class DLQs it.
 */
@Injectable()
export class MessagingCommandsConsumer extends KafkaIntegrationConsumer<SendMessageCommand> {
    protected readonly topics = [SendMessageCommand.TOPIC];

    constructor(
        @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
        producer: KafkaProducerService,
        @Inject(MESSAGE_APPLICATION_SERVICE_TOKEN)
        private readonly _messageService: IMessageApplicationService,
        @Inject(MESSAGE_REPO_TOKEN)
        private readonly _messageRepo: IMessageRepository,
        @Inject(WS_PUSH_PUBLISHER_TOKEN)
        private readonly _wsPushPublisher: IWsPushPublisher,
    ) {
        super(kafka, MESSAGING_COMMANDS_GROUP_ID, producer);
    }

    protected async handleMessage(command: SendMessageCommand): Promise<void> {
        switch (command.commandType) {
            case 'send-message':
                await this._handleSendMessage(command);
                return;
            default:
                throw new PermanentError(
                    new Error(
                        `Unknown commandType "${(command as { commandType: string }).commandType}"`,
                    ),
                    { commandType: (command as { commandType: string }).commandType },
                );
        }
    }

    protected classifyError(err: unknown): 'permanent' | 'transient' {
        if (err instanceof NotFoundException) return 'permanent';
        if (err instanceof ForbiddenException) return 'permanent';
        if (err instanceof BadRequestException) return 'permanent';
        return super.classifyError(err);
    }

    protected async onDeadLettered(
        event: SendMessageCommand | undefined,
        _classification: DlqClassification,
        cause: Error,
    ): Promise<void> {
        if (!event || event.commandType !== 'send-message') return;
        if (!event.senderId || !event.messageId || !event.conversationId) return;

        const reason: MessageRejectedReason =
            cause instanceof MessageIdCollisionError ? 'collision' : 'internal';

        await this._wsPushPublisher.publishToUser(event.senderId, {
            event: 'message:rejected',
            messageId: event.messageId,
            conversationId: event.conversationId,
            reason,
        });
    }

    private async _handleSendMessage(command: SendMessageCommand): Promise<void> {
        try {
            await this._messageService.sendMessage(command.senderId, {
                messageId: command.messageId,
                conversationId: command.conversationId,
                content: command.content,
                attachmentKeys: command.attachmentKeys,
            });
            this.logger.debug(
                `Persisted message ${command.messageId} for conversation ${command.conversationId}`,
            );
            return;
        } catch (err) {
            if (this._isDuplicateKey(err)) {
                await this._handleDuplicateKey(command, err);
                return;
            }
            // Everything else bubbles: classifyError decides permanent vs
            // transient. NestJS HTTP exceptions (NotFound/Forbidden/BadRequest)
            // are permanent per the override above; Mongo/Redis/network blips
            // are transient by default and get retried by the base class.
            throw err;
        }
    }

    /**
     * Three possible outcomes on E11000:
     *   (a) row exists and same sender → legitimate Kafka redelivery → no-op (success)
     *   (b) row exists and different sender → UUID collision OR replay attack →
     *       throw PermanentError → DLQ + back-channel `message:rejected: collision`
     *   (c) row missing → either the colliding row is in another conversation
     *       (our findById scopes by conversationId) or a brief read-after-write
     *       lag. Bubble raw error → base retries 3x. After exhaustion, DLQ as
     *       `transient-exhausted` + back-channel `message:rejected: internal`.
     */
    private async _handleDuplicateKey(
        command: SendMessageCommand,
        originalErr: unknown,
    ): Promise<void> {
        const existing = await this._messageRepo.findById(
            command.conversationId,
            command.messageId,
        );

        if (!existing) {
            this.logger.warn(
                `Duplicate-key on insert but findById returned null; ` +
                    `messageId=${command.messageId} conversationId=${command.conversationId} — ` +
                    `bubbling as transient for bounded retry`,
            );
            throw originalErr;
        }

        if (existing.senderId === command.senderId) {
            this.logger.debug(
                `Idempotent retry for messageId=${command.messageId} (same sender) — no-op`,
            );
            return;
        }

        throw new PermanentError(
            new MessageIdCollisionError(
                command.messageId,
                command.conversationId,
                command.senderId,
                existing.senderId,
            ),
            {
                messageId: command.messageId,
                conversationId: command.conversationId,
                attemptedSenderId: command.senderId,
                existingSenderId: existing.senderId,
            },
        );
    }

    private _isDuplicateKey(err: unknown): boolean {
        return (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: unknown }).code === MONGO_DUPLICATE_KEY_ERROR_CODE
        );
    }
}
