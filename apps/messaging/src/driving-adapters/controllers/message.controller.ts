import { v7 as uuidv7 } from 'uuid';

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

import {
    IMessageApplicationService,
    MESSAGE_APPLICATION_SERVICE_TOKEN,
} from '@application/services/message.application-service';
import {
    IMessageQueryApplicationService,
    MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN,
} from '@application/services/message-query.application-service';
import MESSAGING_ENDPOINT from '../../constants/endpoint.constant';
import { GetMessageHistoryQueryDto } from '@driving-adapters/dtos/get-message-history-query.dto';
import { MessageHistoryResponse } from '@driving-adapters/dtos/message-history.response';
import { MessageResponse } from '@driving-adapters/dtos/message.response';
import { SendMessageDto } from '@driving-adapters/dtos/send-message.dto';

/**
 * TEMPORARY HTTP exerciser for story 6.2.
 *
 * The production send path is WebSocket → realtime-gateway → Kafka → message-app.
 * This controller exists only to validate the storage layer (entity + Mongo +
 * indexes + IClock) before the realtime infrastructure is built in session 2.
 *
 * DELETE THIS CONTROLLER once the WS send path is wired.
 */
@Controller(MESSAGING_ENDPOINT.BASE)
@ApiTags('Messages')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class MessageController {
    constructor(
        @Inject(MESSAGE_APPLICATION_SERVICE_TOKEN)
        private readonly _messageService: IMessageApplicationService,
        @Inject(MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _messageQueryService: IMessageQueryApplicationService,
    ) {}

    @Post(MESSAGING_ENDPOINT.CONVERSATION_MESSAGES)
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: MessageResponse, description: 'Message sent' })
    @ApiBadRequestResponse({ description: 'Invalid input' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Not a member of the conversation' })
    @ApiNotFoundResponse({ description: 'Conversation not found' })
    public async sendMessage(
        @CurrentUser('id') userId: string,
        @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
        @Body() dto: SendMessageDto,
    ): Promise<MessageResponse> {
        return this._messageService.sendMessage(userId, {
            messageId: uuidv7(),
            conversationId,
            content: dto.content ?? '',
            attachmentKeys: dto.attachmentKeys,
        });
    }

    @Get(MESSAGING_ENDPOINT.CONVERSATION_MESSAGES)
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: MessageHistoryResponse,
        description: 'Page of messages, newest-first',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Not a member of the conversation' })
    @ApiNotFoundResponse({ description: 'Conversation not found' })
    public async getMessageHistory(
        @CurrentUser('id') userId: string,
        @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
        @Query() query: GetMessageHistoryQueryDto,
    ): Promise<MessageHistoryResponse> {
        const result = await this._messageQueryService.getHistory(userId, {
            conversationId,
            cursor: query.cursor,
            limit: query.limit ?? 50,
        });

        return {
            items: result.items.map((m) => ({
                id: m.id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                content: m.content,
                attachmentKeys: m.attachmentKeys,
                serverTs: m.serverTs,
                sender: m.sender,
            })),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }
}
