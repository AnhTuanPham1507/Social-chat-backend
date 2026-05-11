import { Module } from '@nestjs/common';

import { USER_APPLICATION_SERVICE_TOKEN, UserApplicationService } from './application/services/user.application-service';
import { FRIENDSHIP_APPLICATION_SERVICE_TOKEN, FriendshipApplicationService } from './application/services/friendship.application-service';
import {
    USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
    UserSearchQueryApplicationService,
} from './application/services/user-search-query.application-service';
import { UserController } from './driving-adapters/controllers/user.controller';
import { InternalUserController } from './driving-adapters/controllers/internal-user.controller';
import { FriendshipController } from './driving-adapters/controllers/friendship.controller';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { FRIEND_REQUEST_REPO_TOKEN } from './application/contracts/friend-request-repository.contract';
import { FRIENDSHIP_REPO_TOKEN } from './application/contracts/friendship-repository.contract';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';
import { FriendRequestRepo } from './driven-adapters/repos/friend-request-repository.adapter';
import { FriendshipRepo } from './driven-adapters/repos/friendship-repository.adapter';
import { DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import { EventEmitterBusAdapter } from '@social-chat/infrastructure';

@Module({
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
            provide: USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: UserSearchQueryApplicationService,
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
            provide: DOMAIN_EVENT_BUS_TOKEN,
            useClass: EventEmitterBusAdapter,
        },
    ],
})
export class UserModule {}
