import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    UseGuards,
} from '@nestjs/common';

import {
    IReadReceiptApplicationService,
    READ_RECEIPT_APPLICATION_SERVICE_TOKEN,
} from '@application/services/read-receipt.application-service';
import { AckReadDto } from '@driving-adapters/dtos/ack-read.dto';
import { InternalAuthGuard } from '@driving-adapters/guards/internal-auth.guard';

/**
 * Internal HTTP fast-path for read-receipt acks.
 *
 * Called by the realtime-gateway when a recipient client emits the
 * `message:read` WS event. Skips the Kafka command pipeline because:
 *   - `$max` upsert is order-independent (Kafka's partition ordering is wasted)
 *   - Read acks are high-frequency, low-stakes (durability not needed —
 *     losing one is fine, next higher absorbs it)
 *   - ~5ms in-cluster hop vs ~50–100ms Kafka round-trip
 *
 * NOT for end-user clients. Protected by InternalAuthGuard (shared-secret).
 */
@Controller('internal/messaging')
@UseGuards(InternalAuthGuard)
export class InternalReadReceiptController {
    constructor(
        @Inject(READ_RECEIPT_APPLICATION_SERVICE_TOKEN)
        private readonly _service: IReadReceiptApplicationService,
    ) {}

    @Post('read-ack')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async ackRead(@Body() dto: AckReadDto): Promise<void> {
        await this._service.ackRead(
            dto.userId,
            dto.conversationId,
            dto.lastReadMessageId,
        );
    }
}
