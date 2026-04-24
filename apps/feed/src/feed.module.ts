import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { POST_APPLICATION_SERVICE_TOKEN, PostApplicationService } from './application/services/post.application-service';
import { REACTION_APPLICATION_SERVICE_TOKEN, ReactionApplicationService } from './application/services/reaction.application-service';
import { COMMENT_APPLICATION_SERVICE_TOKEN, CommentApplicationService } from './application/services/comment.application-service';
import { FEED_CDC_APPLICATION_SERVICE_TOKEN, FeedCdcApplicationService } from './application/services/feed-cdc.application-service';
import { USER_CDC_APPLICATION_SERVICE_TOKEN, UserCdcApplicationService } from './application/services/user-cdc.application-service';
import { POST_QUERY_APPLICATION_SERVICE_TOKEN, PostQueryApplicationService } from './application/services/post-query.application-service';
import { POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN, PostSearchQueryApplicationService } from './application/services/post-search-query.application-service';
import { COMMENT_QUERY_APPLICATION_SERVICE_TOKEN, CommentQueryApplicationService } from './application/services/comment-query.application-service';
import { PostController } from './driving-adapters/controllers/post.controller';
import { ReactionController } from './driving-adapters/controllers/reaction.controller';
import { CommentController } from './driving-adapters/controllers/comment.controller';
import { PostCdcConsumer } from './driving-adapters/consumers/post-cdc.consumer';
import { ReactionCdcConsumer } from './driving-adapters/consumers/reaction-cdc.consumer';
import { CommentCdcConsumer } from './driving-adapters/consumers/comment-cdc.consumer';
import { UserCdcConsumer } from './driving-adapters/consumers/user-cdc.consumer';
import { POST_REPO_TOKEN } from './application/contracts/post-repository.contract';
import { REACTION_REPO_TOKEN } from './application/contracts/reaction-repository.contract';
import { COMMENT_REPO_TOKEN } from './application/contracts/comment-repository.contract';
import { POST_READ_REPO_TOKEN } from './application/contracts/post-read-repository.contract';
import { POST_SEARCH_REPO_TOKEN } from './application/contracts/post-search-repository.contract';
import { REACTION_READ_REPO_TOKEN } from './application/contracts/reaction-read-repository.contract';
import { USER_READ_REPO_TOKEN } from './application/contracts/user-read-repository.contract';
import { COMMENT_READ_REPO_TOKEN } from './application/contracts/comment-read-repository.contract';
import { PostRepo } from './driven-adapters/repos/post-repository.adapter';
import { ReactionRepo } from './driven-adapters/repos/reaction-repository.adapter';
import { CommentRepo } from './driven-adapters/repos/comment-repository.adapter';
import { PostReadRepo } from './driven-adapters/repos/post-read-repository.adapter';
import { ReactionReadRepo } from './driven-adapters/repos/reaction-read-repository.adapter';
import { UserReadRepo } from './driven-adapters/repos/user-read-repository.adapter';
import { CommentReadRepo } from './driven-adapters/repos/comment-read-repository.adapter';
import { PostSearchRepo } from './driven-adapters/repos/post-search-repository.adapter';
import { CommentDeletedListener } from './application/listeners/comment-deleted.listener';
import { DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import {
    PostRead, PostReadSchema, PostReadMongoRepository,
    ReactionRead, ReactionReadSchema, ReactionReadMongoRepository,
    UserRead, UserReadSchema, UserReadMongoRepository,
    CommentRead, CommentReadSchema, CommentReadMongoRepository,
    EventEmitterBusAdapter,
} from '@social-chat/infrastructure';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PostRead.name, schema: PostReadSchema },
            { name: ReactionRead.name, schema: ReactionReadSchema },
            { name: UserRead.name, schema: UserReadSchema },
            { name: CommentRead.name, schema: CommentReadSchema },
        ]),
    ],
    controllers: [PostController, ReactionController, CommentController],
    providers: [
        {
            provide: POST_APPLICATION_SERVICE_TOKEN,
            useClass: PostApplicationService,
        },
        {
            provide: REACTION_APPLICATION_SERVICE_TOKEN,
            useClass: ReactionApplicationService,
        },
        {
            provide: COMMENT_APPLICATION_SERVICE_TOKEN,
            useClass: CommentApplicationService,
        },
        {
            provide: FEED_CDC_APPLICATION_SERVICE_TOKEN,
            useClass: FeedCdcApplicationService,
        },
        {
            provide: USER_CDC_APPLICATION_SERVICE_TOKEN,
            useClass: UserCdcApplicationService,
        },
        {
            provide: POST_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: PostQueryApplicationService,
        },
        {
            provide: COMMENT_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: CommentQueryApplicationService,
        },
        {
            provide: POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
            useClass: PostSearchQueryApplicationService,
        },
        {
            provide: POST_REPO_TOKEN,
            useClass: PostRepo,
        },
        {
            provide: REACTION_REPO_TOKEN,
            useClass: ReactionRepo,
        },
        {
            provide: COMMENT_REPO_TOKEN,
            useClass: CommentRepo,
        },
        {
            provide: POST_READ_REPO_TOKEN,
            useClass: PostReadRepo,
        },
        {
            provide: REACTION_READ_REPO_TOKEN,
            useClass: ReactionReadRepo,
        },
        {
            provide: USER_READ_REPO_TOKEN,
            useClass: UserReadRepo,
        },
        {
            provide: COMMENT_READ_REPO_TOKEN,
            useClass: CommentReadRepo,
        },
        {
            provide: POST_SEARCH_REPO_TOKEN,
            useClass: PostSearchRepo,
        },
        {
            provide: DOMAIN_EVENT_BUS_TOKEN,
            useClass: EventEmitterBusAdapter,
        },
        CommentDeletedListener,
        PostReadMongoRepository,
        ReactionReadMongoRepository,
        UserReadMongoRepository,
        CommentReadMongoRepository,
        PostCdcConsumer,
        ReactionCdcConsumer,
        CommentCdcConsumer,
        UserCdcConsumer,
    ],
})
export class FeedModule {}
