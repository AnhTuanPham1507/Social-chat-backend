import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommentDeletedEvent } from '@social-chat/domain';
import { CommentDeletedIntegrationEvent } from '@social-chat/common';
import { KafkaProducerService } from '@social-chat/infrastructure';

/**
 * Translator: in-process domain event -> cross-context integration event.
 *
 * 1:1 translation — comment deletion does not cascade to replies and
 * requires no composition with other aggregates, so the listener pattern
 * (rather than direct publish from the app service) is the right fit.
 */
@Injectable()
export class CommentDeletedListener {
    constructor(private readonly _kafkaProducer: KafkaProducerService) {}

    @OnEvent('comment.deleted')
    async handle(event: CommentDeletedEvent): Promise<void> {
        const integrationEvent = new CommentDeletedIntegrationEvent(
            event.commentSnapshot,
        );
        await this._kafkaProducer.publish(
            CommentDeletedIntegrationEvent.TOPIC,
            event.commentSnapshot.id,
            integrationEvent,
        );
    }
}
