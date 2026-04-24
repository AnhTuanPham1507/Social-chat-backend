import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { CdcBaseConsumer, DebeziumMessage, KAFKA_CLIENT_TOKEN } from '@social-chat/infrastructure';
import { CDC_GROUP_ID, FEED_TOPIC } from '../../constants/topic.constant';
import {
    FEED_CDC_APPLICATION_SERVICE_TOKEN,
    IFeedCdcApplicationService,
} from '../../application/services/feed-cdc.application-service';

@Injectable()
export class PostCdcConsumer extends CdcBaseConsumer {
    protected readonly topics = [FEED_TOPIC.POST];

    constructor(
        @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
        @Inject(FEED_CDC_APPLICATION_SERVICE_TOKEN)
        private readonly _feedCdcService: IFeedCdcApplicationService,
    ) {
        super(kafka, CDC_GROUP_ID.POST);
    }

    protected async handleCdcMessage(_table: string, message: DebeziumMessage): Promise<void> {
        await this._feedCdcService.handlePostChange(message);
    }
}
