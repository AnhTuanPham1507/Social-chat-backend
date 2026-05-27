import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../contracts/conversation-repository.contract';
import {
    CursorPaginatedResult,
    IMessageRepository,
    MESSAGE_REPO_TOKEN,
    MessageWithSenderModel,
} from '../contracts/message-repository.contract';

export const MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN = Symbol(
    'MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN',
);

export interface GetMessageHistoryInput {
    conversationId: string;
    cursor?: string;
    limit: number;
}

export interface IMessageQueryApplicationService {
    getHistory(
        currentUserId: string,
        input: GetMessageHistoryInput,
    ): Promise<CursorPaginatedResult<MessageWithSenderModel>>;
}

@Injectable()
export class MessageQueryApplicationService
    implements IMessageQueryApplicationService
{
    constructor(
        @Inject(MESSAGE_REPO_TOKEN)
        private readonly _messageRepo: IMessageRepository,
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _conversationRepo: IConversationRepository,
    ) {}

    public async getHistory(
        currentUserId: string,
        input: GetMessageHistoryInput,
    ): Promise<CursorPaginatedResult<MessageWithSenderModel>> {
        const conversation = await this._conversationRepo.findById(
            input.conversationId,
        );
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }
        if (!conversation.hasMember(currentUserId)) {
            throw new ForbiddenException(
                'You are not a member of this conversation',
            );
        }

        return this._messageRepo.findPageWithSender(
            input.conversationId,
            input.limit,
            input.cursor,
        );
    }
}
