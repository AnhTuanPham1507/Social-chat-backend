import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import {
    EventEmitterBusAdapter,
    UserRead,
    UserReadMongoRepository,
    UserReadSchema,
} from '@social-chat/infrastructure';

import { USER_APPLICATION_SERVICE_TOKEN, UserApplicationService } from './application/services/user.application-service';
import { FRIENDSHIP_APPLICATION_SERVICE_TOKEN, FriendshipApplicationService } from './application/services/friendship.application-service';
import { PRESENCE_APP_SERVICE_TOKEN, PresenceApplicationService } from './application/services/presence.application-service';
import {
    USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
    UserSearchQueryApplicationService,
} from './application/services/user-search-query.application-service';
import {
    USER_CDC_APPLICATION_SERVICE_TOKEN,
    UserCdcApplicationService,
} from './application/services/user-cdc.application-service';
import { UserController } from './driving-adapters/controllers/user.controller';
import { InternalUserController } from './driving-adapters/controllers/internal-user.controller';
import { FriendshipController } from './driving-adapters/controllers/friendship.controller';
import { UserCdcConsumer } from './driving-adapters/consumers/user-cdc.consumer';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { FRIEND_REQUEST_REPO_TOKEN } from './application/contracts/friend-request-repository.contract';
import { FRIENDSHIP_REPO_TOKEN } from './application/contracts/friendship-repository.contract';
import { PRESENCE_READ_REPO_TOKEN } from './application/contracts/presence-repository.contract';
import { USER_READ_REPO_TOKEN } from './application/contracts/user-read-repository.contract';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';
import { FriendRequestRepo } from './driven-adapters/repos/friend-request-repository.adapter';
import { FriendshipRepo } from './driven-adapters/repos/friendship-repository.adapter';
import { PresenceReadRedisAdapter } from './driven-adapters/repos/presence-repository.adapter';
import { UserReadRepo } from './driven-adapters/repos/user-read-repository.adapter';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserRead.name, schema: UserReadSchema },
        ]),
    ],
    controllers: [UserController, InternalUserController, FriendshipController],
    providers: [
        {
            provide: USER_APPLICATION_SERVICE_TOKEN,
            useClass: UserApplicationService,
        },
        {
            provide: FRIENDSHIP_APPLICATION_SERVICE_TOKEN,
            useClass: FriendshipApplicationService,
        },
        {
            provide: PRESENCE_APP_SERVICE_TOKEN,
            useClass: PresenceApplicationService,
        },
        {
            provide: USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: UserSearchQueryApplicationService,
        },
        {
            provide: USER_CDC_APPLICATION_SERVICE_TOKEN,
            useClass: UserCdcApplicationService,
        },
        {
            provide: USER_REPO_TOKEN,
            useClass: UserRepo,
        },
        {
            provide: FRIEND_REQUEST_REPO_TOKEN,
            useClass: FriendRequestRepo,
        },
        {
            provide: FRIENDSHIP_REPO_TOKEN,
            useClass: FriendshipRepo,
        },
        {
            provide: PRESENCE_READ_REPO_TOKEN,
            useClass: PresenceReadRedisAdapter,
        },
        {
            provide: USER_READ_REPO_TOKEN,
            useClass: UserReadRepo,
        },
        {
            provide: DOMAIN_EVENT_BUS_TOKEN,
            useClass: EventEmitterBusAdapter,
        },
        UserReadMongoRepository,
        UserCdcConsumer,
    ],
})
export class UserModule {}
