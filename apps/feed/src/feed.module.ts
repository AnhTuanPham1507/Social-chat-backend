import { Module } from '@nestjs/common';

import { FEED_APPLICATION_SERVICE_TOKEN, FeedApplicationService } from './application/services/feed.application-service';
import { FeedController } from './driving-adapters/controllers/feed.controller';
import { POST_REPO_TOKEN } from './application/contracts/post-repository.contract';
import { PostRepo } from './driven-adapters/repos/post-repository.adapter';
import { FeedEventPublisherAdapter } from './driven-adapters/event-publisher/feed-event-publisher.adapter';

@Module({
    controllers: [FeedController],
    providers: [
        {
            provide: FEED_APPLICATION_SERVICE_TOKEN,
            useClass: FeedApplicationService,
        },
        {
            provide: POST_REPO_TOKEN,
            useClass: PostRepo,
        },
        FeedEventPublisherAdapter,
    ],
})
export class FeedModule {}
