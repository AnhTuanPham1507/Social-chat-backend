import { Module } from '@nestjs/common';

import {
  ASSET_APPLICATION_SERVICE_TOKEN,
  AssetApplicationService,
} from './application/application-services/asset.application-service';
import { ImageProcessingApplicationService } from './application/application-services/image-processing.application-service';
import { VideoProcessingApplicationService } from './application/application-services/video-processing.application-service';
import { AssetPathService } from './application/application-services/asset-path.service';
import { AssetConfirmedListener } from './application/listeners/asset-confirmed.listener';
import { ASSET_REPO_TOKEN } from './application/contracts/asset-repository.contract';
import { OBJECT_STORAGE_SERVICE_TOKEN } from './application/contracts/object-storage-service.contract';
import { IMAGE_PROCESSING_SERVICE_TOKEN } from './application/contracts/image-processing-service.contract';
import { VIDEO_TRANSCODING_SERVICE_TOKEN } from './application/contracts/video-transcoding-service.contract';
import { AssetRepo } from './driven-adapters/repos/asset-repository.adapter';
import { ObjectStorageAdapter } from './driven-adapters/storage/object-storage.adapter';
import { ImgproxyAdapter } from './driven-adapters/image-processing/imgproxy.adapter';
import { CoconutAdapter } from './driven-adapters/video-transcoding/coconut.adapter';
import { AssetController } from './driving-adapters/controllers/asset.controller';
import { WebhookController } from './driving-adapters/controllers/webhook.controller';
import { PostDeletedCleanupConsumer } from './driving-adapters/consumers/post-deleted-cleanup.consumer';
import { CommentDeletedCleanupConsumer } from './driving-adapters/consumers/comment-deleted-cleanup.consumer';
import { DOMAIN_EVENT_BUS_TOKEN } from '@social-chat/domain';
import { EventEmitterBusAdapter } from '@social-chat/infrastructure';

@Module({
  controllers: [AssetController, WebhookController],
  providers: [
    {
      provide: ASSET_APPLICATION_SERVICE_TOKEN,
      useClass: AssetApplicationService,
    },
    {
      provide: ASSET_REPO_TOKEN,
      useClass: AssetRepo,
    },
    {
      provide: OBJECT_STORAGE_SERVICE_TOKEN,
      useClass: ObjectStorageAdapter,
    },
    {
      provide: IMAGE_PROCESSING_SERVICE_TOKEN,
      useClass: ImgproxyAdapter,
    },
    {
      provide: VIDEO_TRANSCODING_SERVICE_TOKEN,
      useClass: CoconutAdapter,
    },
    {
      provide: DOMAIN_EVENT_BUS_TOKEN,
      useClass: EventEmitterBusAdapter,
    },
    AssetPathService,
    ImageProcessingApplicationService,
    VideoProcessingApplicationService,
    AssetConfirmedListener,
    PostDeletedCleanupConsumer,
    CommentDeletedCleanupConsumer,
  ],
  exports: [ASSET_APPLICATION_SERVICE_TOKEN],
})
export class AssetModule {}
