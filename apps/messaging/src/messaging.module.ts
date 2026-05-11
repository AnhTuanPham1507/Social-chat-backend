import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CLOCK_TOKEN, DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import {
    EventEmitterBusAdapter,
    Message,
    MessageMongoRepository,
    MessageSchema,
    SystemClock,
} from '@social-chat/infrastructure';

import { CONVERSATION_REPO_TOKEN } from './application/contracts/conversation-repository.contract';
import { MESSAGE_REPO_TOKEN } from './application/contracts/message-repository.contract';
import {
    CONVERSATION_APPLICATION_SERVICE_TOKEN,
    ConversationApplicationService,
} from './application/services/conversation.application-service';
import {
    MESSAGE_APPLICATION_SERVICE_TOKEN,
    MessageApplicationService,
} from './application/services/message.application-service';
import { ConversationController } from './driving-adapters/controllers/conversation.controller';
import { MessageController } from './driving-adapters/controllers/message.controller';
import { ConversationRepo } from './driven-adapters/repos/conversation-repository.adapter';
import { MessageRepo } from './driven-adapters/repos/message-repository.adapter';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ],
    controllers: [ConversationController, MessageController],
    providers: [
        {
            provide: DOMAIN_EVENT_BUS_TOKEN,
            useClass: EventEmitterBusAdapter,
        },
        {
            provide: CLOCK_TOKEN,
            useClass: SystemClock,
        },
        {
            provide: CONVERSATION_REPO_TOKEN,
            useClass: ConversationRepo,
        },
        {
            provide: CONVERSATION_APPLICATION_SERVICE_TOKEN,
            useClass: ConversationApplicationService,
        },
        MessageMongoRepository,
        {
            provide: MESSAGE_REPO_TOKEN,
            useClass: MessageRepo,
        },
        {
            provide: MESSAGE_APPLICATION_SERVICE_TOKEN,
            useClass: MessageApplicationService,
        },
    ],
    exports: [],
})
export class MessagingModule {}
