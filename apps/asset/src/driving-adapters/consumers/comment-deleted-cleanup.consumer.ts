import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import {
  KafkaIntegrationConsumer,
  KAFKA_CLIENT_TOKEN,
} from '@social-chat/infrastructure';
import { CommentDeletedIntegrationEvent } from '@social-chat/common';
import { COMMENT_DELETED_CLEANUP_GROUP_ID } from 'src/constants/messaging.constant';
import {
  OBJECT_STORAGE_SERVICE_TOKEN,
  IObjectStorageService,
} from '@application/contracts/object-storage-service.contract';
import { AssetPathService } from '../../application/application-services/asset-path.service';

/**
 * Cleans up R2 assets when an individual comment is deleted.
 *
 * Cascaded deletions from a parent post are handled separately by
 * `PostDeletedCleanupConsumer` via `cascadedCommentSnapshots` on the
 * post-deleted integration event.
 */
@Injectable()
export class CommentDeletedCleanupConsumer extends KafkaIntegrationConsumer<CommentDeletedIntegrationEvent> {
  protected readonly topics = [CommentDeletedIntegrationEvent.TOPIC];

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
    private readonly _assetPathService: AssetPathService,
  ) {
    super(kafka, COMMENT_DELETED_CLEANUP_GROUP_ID);
  }

  protected async handleMessage(
    event: CommentDeletedIntegrationEvent,
  ): Promise<void> {
    const attachmentKeys = event.commentSnapshot.attachments ?? [];

    if (attachmentKeys.length === 0) {
      return;
    }

    this.logger.log(
      `Cleaning up ${attachmentKeys.length} assets for deleted comment=${event.commentSnapshot.id}`,
    );

    await Promise.all(
      attachmentKeys.map(async (key) => {
        const prefix = this._assetPathService.generateVariantPrefix(key);
        await this._storageService.deleteByPrefix(prefix);
      }),
    );
  }
}
