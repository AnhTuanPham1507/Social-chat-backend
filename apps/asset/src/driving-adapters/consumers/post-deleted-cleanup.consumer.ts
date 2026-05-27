import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import {
  KafkaIntegrationConsumer,
  KAFKA_CLIENT_TOKEN,
  KafkaProducerService,
} from '@social-chat/infrastructure';
import { PostDeletedIntegrationEvent } from '@social-chat/common';
import { POST_DELETED_CLEANUP_GROUP_ID } from 'src/constants/messaging.constant';
import {
  OBJECT_STORAGE_SERVICE_TOKEN,
  IObjectStorageService,
} from '@application/contracts/object-storage-service.contract';
import { AssetPathService } from '../../application/application-services/asset-path.service';

/**
 * Cleans up R2 assets when a post is deleted.
 *
 * Subscribes to the cross-context integration event, which carries both the
 * post's own snapshot and the snapshots of any cascaded comments. Both sets
 * of attachments are removed from object storage.
 */
@Injectable()
export class PostDeletedCleanupConsumer extends KafkaIntegrationConsumer<PostDeletedIntegrationEvent> {
  protected readonly topics = [PostDeletedIntegrationEvent.TOPIC];

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
    producer: KafkaProducerService,
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
    private readonly _assetPathService: AssetPathService,
  ) {
    super(kafka, POST_DELETED_CLEANUP_GROUP_ID, producer);
  }

  protected async handleMessage(
    event: PostDeletedIntegrationEvent,
  ): Promise<void> {
    const postAttachmentKeys = event.postSnapshot.attachmentKeys ?? [];
    const commentAttachmentKeys = (event.cascadedCommentSnapshots ?? []).flatMap(
      (c) => c.attachments ?? [],
    );
    const allKeys = [...postAttachmentKeys, ...commentAttachmentKeys];

    if (allKeys.length === 0) {
      return;
    }

    this.logger.log(
      `Cleaning up ${allKeys.length} assets for deleted post=${event.postSnapshot.id} ` +
        `(post=${postAttachmentKeys.length}, cascadedComments=${commentAttachmentKeys.length})`,
    );

    await Promise.all(
      allKeys.map(async (key) => {
        const prefix = this._assetPathService.generateVariantPrefix(key);
        await this._storageService.deleteByPrefix(prefix);
      }),
    );
  }
}
