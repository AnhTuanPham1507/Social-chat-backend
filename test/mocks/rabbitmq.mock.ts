import { Global, Injectable, Module } from '@nestjs/common';
import { DIToken } from '../../src/core/enums/di-tokens.enum';
import { EventActions } from '../../src/core/enums/event-action.enum';
import { QueueName } from '../../src/core/enums/queue-name';

@Injectable()
export class MockedRabbitMQService {
    constructor() {}

    sendMessage(queue: QueueName, message: any, action: EventActions) {}
}

@Module({
    providers: [
        {
            provide: DIToken.QUEUE_SERVICE,
            useClass: MockedRabbitMQService,
        },
    ],
    exports: [DIToken.QUEUE_SERVICE],
})
@Global()
export class MockedRabbitMQModule {}
