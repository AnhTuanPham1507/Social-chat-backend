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
import { MessageDTO, SendTextMessageInput } from '../dtos/message.dto';
import { MessageAppMapper } from '../mappers/message-app.mapper';

export const MESSAGE_APPLICATION_SERVICE_TOKEN = Symbol(
    'MESSAGE_APPLICATION_SERVICE_TOKEN',
);

export interface IMessageApplicationService {
    sendText(currentUserId: string, input: SendTextMessageInput): Promise<MessageDTO>;
}

@Injectable()
export class MessageApplicationService implements IMessageApplicationService {
    constructor(
        @Inject(MESSAGE_REPO_TOKEN)
        private readonly _messageRepo: IMessageRepository,
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
        @Inject(CLOCK_TOKEN)
        private readonly _clock: IClock,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
    ) {}

    public async sendText(
        currentUserId: string,
        input: SendTextMessageInput,
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
                conversationId: input.conversationId,
                senderId: currentUserId,
                content: input.content,
            },
            serverTs,
        );

        await this._messageRepo.insert(message);
        await this._domainEventBus.publishAll(message.publishEvents());

        return MessageAppMapper.fromEntityToAppModel(message);
    }
}
