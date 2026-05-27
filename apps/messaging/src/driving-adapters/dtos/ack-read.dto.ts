import { IsUUID } from 'class-validator';

/**
 * Body for the internal `/internal/messaging/read-ack` endpoint.
 *
 * `userId` is asserted by the calling service (the realtime-gateway, which
 * has already JWT-verified the user on the WS handshake). The InternalAuthGuard
 * authorizes the *service*; this field carries the *subject*.
 */
export class AckReadDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    conversationId: string;

    @IsUUID()
    lastReadMessageId: string;
}
