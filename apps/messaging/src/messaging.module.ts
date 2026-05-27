import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CLOCK_TOKEN, DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import {
    EventEmitterBusAdapter,
    Message,
    MessageMongoRepository,
    MessageSchema,
    MessagingUserRead,
    MessagingUserReadMongoRepository,
    MessagingUserReadSchema,
    ParticipantState,
    ParticipantStateMongoRepository,
    ParticipantStateSchema,
    SystemClock,
} from '@social-chat/infrastructure';

import { CONVERSATION_REPO_TOKEN } from './application/contracts/conversation-repository.contract';
import { MESSAGE_REPO_TOKEN } from './application/contracts/message-repository.contract';
import { PARTICIPANT_STATE_REPO_TOKEN } from './application/contracts/participant-state-repository.contract';
import { USER_READ_REPO_TOKEN } from './application/contracts/user-read-repository.contract';
import { WS_PUSH_PUBLISHER_TOKEN } from './application/contracts/ws-push-publisher.contract';
import { ConversationActivityListener } from './application/listeners/conversation-activity.listener';
import { ConversationMembershipListener } from './application/listeners/conversation-membership.listener';
import {
    CONVERSATION_APPLICATION_SERVICE_TOKEN,
    ConversationApplicationService,
} from './application/services/conversation.application-service';
import {
    MESSAGE_APPLICATION_SERVICE_TOKEN,
    MessageApplicationService,
} from './application/services/message.application-service';
import {
    MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN,
    MessageQueryApplicationService,
} from './application/services/message-query.application-service';
import {
    READ_RECEIPT_APPLICATION_SERVICE_TOKEN,
    ReadReceiptApplicationService,
} from './application/services/read-receipt.application-service';
import {
    READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN,
    ReadReceiptQueryApplicationService,
} from './application/services/read-receipt-query.application-service';
import {
    USER_CDC_APPLICATION_SERVICE_TOKEN,
    UserCdcApplicationService,
} from './application/services/user-cdc.application-service';
import { ConversationController } from './driving-adapters/controllers/conversation.controller';
import { InternalReadReceiptController } from './driving-adapters/controllers/internal-read-receipt.controller';
import { MessageController } from './driving-adapters/controllers/message.controller';
import { MessagingCommandsConsumer } from './driving-adapters/consumers/messaging-commands.consumer';
import { UserCdcConsumer } from './driving-adapters/consumers/user-cdc.consumer';
import { ConversationRepo } from './driven-adapters/repos/conversation-repository.adapter';
import { MessageRepo } from './driven-adapters/repos/message-repository.adapter';
import { ParticipantStateRepo } from './driven-adapters/repos/participant-state-repository.adapter';
import { UserReadRepo } from './driven-adapters/repos/user-read-repository.adapter';
import { RedisWsPushPublisher } from './driven-adapters/ws-push/redis-ws-push-publisher.adapter';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: MessagingUserRead.name, schema: MessagingUserReadSchema },
            { name: ParticipantState.name, schema: ParticipantStateSchema },
        ]),
    ],
    controllers: [
        ConversationController,
        MessageController,
        InternalReadReceiptController,
    ],
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
        MessagingUserReadMongoRepository,
        ParticipantStateMongoRepository,
        {
            provide: MESSAGE_REPO_TOKEN,
            useClass: MessageRepo,
        },
        {
            provide: USER_READ_REPO_TOKEN,
            useClass: UserReadRepo,
        },
        {
            provide: PARTICIPANT_STATE_REPO_TOKEN,
            useClass: ParticipantStateRepo,
        },
        {
            provide: MESSAGE_APPLICATION_SERVICE_TOKEN,
            useClass: MessageApplicationService,
        },
        {
            provide: MESSAGE_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: MessageQueryApplicationService,
        },
        {
            provide: READ_RECEIPT_APPLICATION_SERVICE_TOKEN,
            useClass: ReadReceiptApplicationService,
        },
        {
            provide: READ_RECEIPT_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: ReadReceiptQueryApplicationService,
        },
        {
            provide: USER_CDC_APPLICATION_SERVICE_TOKEN,
            useClass: UserCdcApplicationService,
        },
        {
            provide: WS_PUSH_PUBLISHER_TOKEN,
            useClass: RedisWsPushPublisher,
        },
        ConversationActivityListener,
        ConversationMembershipListener,
        MessagingCommandsConsumer,
        UserCdcConsumer,
    ],
    exports: [],
})
export class MessagingModule {}
