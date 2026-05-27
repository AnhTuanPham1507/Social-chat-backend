import {
    ArrayMaxSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
} from 'class-validator';

import { MESSAGE_CONTENT_MAX_LENGTH } from '@social-chat/domain';

const MAX_ATTACHMENTS_PER_MESSAGE = 10;

/**
 * Wire payload for the `message:send` WS event.
 *
 * `messageId` is generated client-side (UUID v7) so the client can persist
 * the message in its outbox before the network round-trip and dedupe retries
 * end-to-end. `senderId` is intentionally absent — the gateway extracts it
 * from the verified JWT, never the payload.
 *
 * Either `content` or `attachmentKeys` must be present (composition invariant
 * lives in the domain entity; this DTO only enforces field-level shape so
 * empty messages still reach the entity for a uniform error path).
 */
export class SendMessageWsDto {
    @IsUUID()
    messageId: string;

    @IsUUID()
    conversationId: string;

    @IsOptional()
    @IsString()
    @MaxLength(MESSAGE_CONTENT_MAX_LENGTH)
    content?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(MAX_ATTACHMENTS_PER_MESSAGE)
    @IsString({ each: true })
    attachmentKeys?: string[];

    @IsInt()
    @Min(0)
    clientSentAt: number;
}
