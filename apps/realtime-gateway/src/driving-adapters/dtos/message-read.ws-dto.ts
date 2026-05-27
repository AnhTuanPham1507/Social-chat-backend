import { IsUUID } from 'class-validator';

/**
 * Wire payload for the `message:read` WS event.
 *
 * `userId` is intentionally absent — gateway extracts it from the verified
 * JWT, never the payload. Same trust pattern as `SendMessageWsDto`.
 */
export class MessageReadWsDto {
    @IsUUID()
    conversationId: string;

    @IsUUID()
    lastReadMessageId: string;
}
