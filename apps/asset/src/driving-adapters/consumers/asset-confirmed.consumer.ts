import { Inject, Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import {
  KafkaBaseConsumer,
  KafkaEventMessage,
  IKafkaConfig,
  KAFKA_CLIENT_TOKEN,
  KAFKA_CONFIG_TOKEN,
} from '@social-chat/infrastructure';
import { ASSET_PURPOSE, ASSET_TYPE } from '@social-chat/domain';
import { ImageProcessingApplicationService } from '../../application/application-services/image-processing.application-service';
import { VideoProcessingApplicationService } from '../../application/application-services/video-processing.application-service';

/**
 * Kafka consumer that listens for AssetConfirmed events.
 *
 * When an asset upload is confirmed, this consumer triggers:
 * - Image: variant generation via imgproxy
 * - Video: transcoding via Coconut.co
 *
 * This is a "driving adapter" — same role as an HTTP controller,
 * but triggered by Kafka messages instead of HTTP requests.
 */
@Injectable()
export class AssetConfirmedConsumer extends KafkaBaseConsumer {
  protected readonly topics = ['asset.asset.confirmed'];

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
    @Inject(KAFKA_CONFIG_TOKEN) config: IKafkaConfig,
    private readonly _imageProcessingService: ImageProcessingApplicationService,
    private readonly _videoProcessingService: VideoProcessingApplicationService,
  ) {
    super(kafka, config);
  }

  protected async handleMessage(message: KafkaEventMessage): Promise<void> {
    const { payload } = message;
    const assetType = payload.assetType as ASSET_TYPE;

    const input = {
      assetId: payload.assetId as string,
      key: payload.key as string,
      assetType,
      purpose: payload.purpose as ASSET_PURPOSE,
      mimeType: payload.mimeType as string,
      size: payload.size as number,
    };

    if (assetType === ASSET_TYPE.VIDEO) {
      await this._videoProcessingService.processVideo(input);
    } else {
      await this._imageProcessingService.processAsset(input);
    }
  }
}
