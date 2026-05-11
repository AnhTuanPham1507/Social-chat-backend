import {
    BadRequestException,
    Body,
    Controller,
    HttpStatus,
    Inject,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
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
import MESSAGING_ENDPOINT from '../../constants/endpoint.constant';
import { CreateConversationDto } from '@driving-adapters/dtos/create-conversation.dto';
import { ConversationResponse } from '@driving-adapters/dtos/conversation.response';

@Controller(MESSAGING_ENDPOINT.BASE)
@ApiTags('Conversations')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ConversationController {
    constructor(
        @Inject(CONVERSATION_APPLICATION_SERVICE_TOKEN)
        private readonly _conversationService: IConversationApplicationService,
    ) {}

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
}
