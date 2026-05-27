import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    CLOCK_TOKEN,
    DOMAIN_EVENT_BUS_TOKEN,
    IClock,
    IDomainEventBus,
    MessageEntity,
} from '@social-chat/domain';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../contracts/conversation-repository.contract';
import {
    IMessageRepository,
    MESSAGE_REPO_TOKEN,
} from '../contracts/message-repository.contract';
import {
    IParticipantStateRepository,
    PARTICIPANT_STATE_REPO_TOKEN,
} from '../contracts/participant-state-repository.contract';
import { MessageDTO, SendMessageInput } from '../dtos/message.dto';
import { MessageAppMapper } from '../mappers/message-app.mapper';
import { MessageCreatedEvent, MessageReadEvent } from '@social-chat/common';
import { IWsPushPublisher, WS_PUSH_PUBLISHER_TOKEN } from '@application/contracts/ws-push-publisher.contract';

export const MESSAGE_APPLICATION_SERVICE_TOKEN = Symbol(
    'MESSAGE_APPLICATION_SERVICE_TOKEN',
);

export interface IMessageApplicationService {
    sendMessage(currentUserId: string, input: SendMessageInput): Promise<MessageDTO>;
}

@Injectable()
export class MessageApplicationService implements IMessageApplicationService {
    constructor(
        @Inject(MESSAGE_REPO_TOKEN)
        private readonly _messageRepo: IMessageRepository,
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
        @Inject(PARTICIPANT_STATE_REPO_TOKEN)
        private readonly _participantStateRepo: IParticipantStateRepository,
        @Inject(CLOCK_TOKEN)
        private readonly _clock: IClock,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
        @Inject(WS_PUSH_PUBLISHER_TOKEN)
        private readonly _wsPushPublisher: IWsPushPublisher,
    ) { }

    public async sendMessage(
        currentUserId: string,
        input: SendMessageInput,
    ): Promise<MessageDTO> {
        const conversation = await this._conversationRepo.findById(input.conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }
        if (!conversation.hasMember(currentUserId)) {
            throw new ForbiddenException(
                'You are not a member of this conversation',
            );
        }

        const serverTs = this._clock.now();
        const message = MessageEntity.send(
            {
                messageId: input.messageId,
                conversationId: input.conversationId,
                senderId: currentUserId,
                content: input.content,
                attachmentKeys: input.attachmentKeys,
            },
            serverTs,
        );

        await this._messageRepo.insert(message);
        await this._autoAckSender(message, serverTs);
        await this._pushWsEvent(message);
        await this._domainEventBus.publishAll(message.publishEvents());

        return MessageAppMapper.fromEntityToAppModel(message);
    }

    private async _autoAckSender(message: MessageEntity, readAt: Date): Promise<void> {
        const { advanced } = await this._participantStateRepo.advanceReadWatermark(
            message.conversationId,
            message.senderId,
            message.id,
            readAt,
        );
        if (!advanced) return;

        const wsEvent: MessageReadEvent = {
            event: 'message:read',
            conversationId: message.conversationId,
            userId: message.senderId,
            lastReadMessageId: message.id,
            lastReadAt: readAt.toISOString(),
        };
        await this._wsPushPublisher.publishToConversation(message.conversationId, wsEvent);
    }

    private async _pushWsEvent(event: MessageEntity) {
        const wsEvent: MessageCreatedEvent = {
            event: 'message:created',
            messageId: event.id,
            conversationId: event.conversationId,
            senderId: event.senderId,
            content: event.content,
            attachmentKeys: event.attachmentKeys,
            serverTs: event.serverTs.toISOString(),
        };

        await this._wsPushPublisher.publishToConversation(event.conversationId, wsEvent);
    }
}
