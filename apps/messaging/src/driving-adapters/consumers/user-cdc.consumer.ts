import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

import {
    CdcBaseConsumer,
    DebeziumMessage,
    KAFKA_CLIENT_TOKEN,
} from '@social-chat/infrastructure';

import {
    CDC_GROUP_ID,
    MESSAGING_CDC_TOPIC,
} from '../../constants/messaging.constant';
import {
    IUserCdcApplicationService,
    USER_CDC_APPLICATION_SERVICE_TOKEN,
} from '../../application/services/user-cdc.application-service';

@Injectable()
export class UserCdcConsumer extends CdcBaseConsumer {
    protected readonly topics = [MESSAGING_CDC_TOPIC.USER];

    constructor(
        @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
        @Inject(USER_CDC_APPLICATION_SERVICE_TOKEN)
        private readonly _userCdcService: IUserCdcApplicationService,
    ) {
        super(kafka, CDC_GROUP_ID.USER);
    }

    protected async handleCdcMessage(
        _table: string,
        message: DebeziumMessage,
    ): Promise<void> {
        await this._userCdcService.handleUserChange(message);
    }
}
