import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpStatus,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Res,
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
import type { Response } from 'express';

import { CONVERSATION_TYPE } from '@social-chat/domain';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

import {
    CONVERSATION_APPLICATION_SERVICE_TOKEN,
    IConversationApplicationService,
} from '@application/services/conversation.application-service';
import {
    IReadReceiptQueryApplicationService,
    READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN,
} from '@application/services/read-receipt-query.application-service';
import MESSAGING_ENDPOINT from '../../constants/endpoint.constant';
import { CreateConversationDto } from '@driving-adapters/dtos/create-conversation.dto';
import {
    ConversationPageResponse,
    ConversationResponse,
} from '@driving-adapters/dtos/conversation.response';
import { ListConversationsQueryDto } from '@driving-adapters/dtos/list-conversations-query.dto';
import { ParticipantStateListResponse } from '@driving-adapters/dtos/participant-state.response';

@Controller(MESSAGING_ENDPOINT.BASE)
@ApiTags('Conversations')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ConversationController {
    constructor(
        @Inject(CONVERSATION_APPLICATION_SERVICE_TOKEN)
        private readonly _conversationService: IConversationApplicationService,
        @Inject(READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _readReceiptQueryService: IReadReceiptQueryApplicationService,
    ) {}

    @Get(MESSAGING_ENDPOINT.CONVERSATIONS)
    @ApiOkResponse({ type: ConversationPageResponse, description: 'Inbox of conversations the caller is a member of, newest activity first.' })
    @ApiBadRequestResponse({ description: 'Invalid cursor or limit' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized — invalid or missing token' })
    public async listConversations(
        @CurrentUser('id') userId: string,
        @Query() query: ListConversationsQueryDto,
    ): Promise<ConversationPageResponse> {
        return this._conversationService.listForUser(userId, {
            cursor: query.cursor,
            limit: query.limit,
        });
    }

    @Post(MESSAGING_ENDPOINT.CONVERSATIONS)
    @ApiCreatedResponse({ type: ConversationResponse, description: 'New conversation created' })
    @ApiOkResponse({ type: ConversationResponse, description: 'Existing DM returned (idempotent)' })
    @ApiBadRequestResponse({ description: 'Invalid input' })
    @ApiForbiddenResponse({ description: 'Caller must be a member of the conversation being created' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized — invalid or missing token' })
    public async createConversation(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateConversationDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<ConversationResponse> {
        if (dto.type === CONVERSATION_TYPE.DIRECT) {
            const result = await this._conversationService.createDM(userId, {
                memberIds: dto.memberIds,
            });
            res.status(result.existed ? HttpStatus.OK : HttpStatus.CREATED);
            return result.conversation;
        }

        if (dto.type === CONVERSATION_TYPE.GROUP) {
            if (!dto.name || !dto.name.trim()) {
                throw new BadRequestException('Group conversation requires a name');
            }
            const conversation = await this._conversationService.createGroup(userId, {
                name: dto.name,
                memberIds: dto.memberIds,
            });
            res.status(HttpStatus.CREATED);
            return conversation;
        }

        throw new BadRequestException(`Unsupported conversation type: ${dto.type}`);
    }

    /**
     * Bulk read-state for a conversation. Used by clients on conversation-open
     * (or WS reconnect) to bootstrap the "who has read what" map — heals any
     * `message:read` broadcasts that were dropped while offline.
     */
    @Get(MESSAGING_ENDPOINT.CONVERSATION_PARTICIPANT_STATES)
    @ApiOkResponse({
        type: ParticipantStateListResponse,
        description: 'Per-member read watermarks for the conversation',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Not a member of the conversation' })
    @ApiNotFoundResponse({ description: 'Conversation not found' })
    public async listParticipantStates(
        @CurrentUser('id') userId: string,
        @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    ): Promise<ParticipantStateListResponse> {
        const states = await this._readReceiptQueryService.listForConversation(
            userId,
            conversationId,
        );

        return {
            items: states.map((s) => ({
                userId: s.userId,
                lastReadMessageId: s.lastReadMessageId,
                lastReadAt: s.lastReadAt ? s.lastReadAt.toISOString() : null,
            })),
        };
    }
}
