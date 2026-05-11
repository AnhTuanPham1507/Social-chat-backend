import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

import {
    IMessageApplicationService,
    MESSAGE_APPLICATION_SERVICE_TOKEN,
} from '@application/services/message.application-service';
import MESSAGING_ENDPOINT from '../../constants/endpoint.constant';
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
        return this._messageService.sendText(userId, {
            conversationId,
            content: dto.content,
        });
    }
}
