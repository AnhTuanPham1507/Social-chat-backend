import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AssetConfirmedEvent, ASSET_TYPE } from '@social-chat/domain';
import { ImageProcessingApplicationService } from '../application-services/image-processing.application-service';
import { VideoProcessingApplicationService } from '../application-services/video-processing.application-service';

/**
 * Triggers variant generation (images) or transcoding (videos) when an asset
 * upload is confirmed. Same bounded context as the emitter, so subscribes in-process
 * via @OnEvent rather than going through Kafka.
 *
 * NOTE on durability: @nestjs/event-emitter is in-memory and fire-and-forget —
 * if the process crashes mid-processing, the work is lost. Acceptable here
 * because the client can re-trigger via `PUT /assets/:id/confirm`. If we ever
 * need at-least-once delivery (retries, replay), switch this to a job queue
 * (BullMQ) or resurrect the Kafka path as an asset-scoped integration event.
 */
@Injectable()
export class AssetConfirmedListener {
    private readonly _logger = new Logger(AssetConfirmedListener.name);

    constructor(
        private readonly _imageProcessingService: ImageProcessingApplicationService,
        private readonly _videoProcessingService: VideoProcessingApplicationService,
    ) {}

    @OnEvent(AssetConfirmedEvent.EVENT_NAME, { async: true })
    async handle(event: AssetConfirmedEvent): Promise<void> {
        const input = {
            assetId: event.assetId,
            key: event.key,
            assetType: event.assetType,
            purpose: event.purpose,
            mimeType: event.mimeType,
            size: event.size,
        };

        try {
            if (event.assetType === ASSET_TYPE.VIDEO) {
                await this._videoProcessingService.processVideo(input);
            } else {
                await this._imageProcessingService.processAsset(input);
            }
        } catch (error) {
            this._logger.error(
                `Failed to process asset ${event.assetId}: ${error instanceof Error ? error.message : error}`,
            );
        }
    }
}
