import { randomUUID } from 'crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ASSET_TYPE,
  ASSET_PURPOSE,
  VIDEO_VARIANTS,
  HLS_SEGMENT_DURATION,
  buildCoconutVariants,
} from '@social-chat/domain';
import {
  OBJECT_STORAGE_SERVICE_TOKEN,
  IObjectStorageService,
} from '../contracts/object-storage-service.contract';
import {
  VIDEO_TRANSCODING_SERVICE_TOKEN,
  IVideoTranscodingService,
} from '../contracts/video-transcoding-service.contract';
import {
  ASSET_REPO_TOKEN,
  IAssetRepository,
} from '../contracts/asset-repository.contract';
import { AssetPathService } from './asset-path.service';

export interface ProcessVideoInput {
  assetId: string;
  key: string;
  assetType: ASSET_TYPE;
  purpose: ASSET_PURPOSE;
  mimeType: string;
  size: number;
}

export interface CoconutOutput {
  key: string;
  type: string;
  format: string;
  status: string;
  url?: string;
  urls?: string[];
  metadata?: Record<string, any>;
}

export interface HandleTranscodingWebhookInput {
  status: string;
  jobId: string;
  token: string;
  outputs?: CoconutOutput[];
  progress?: string;
}

@Injectable()
export class VideoProcessingApplicationService {
  private readonly _logger = new Logger(VideoProcessingApplicationService.name);

  constructor(
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
    @Inject(VIDEO_TRANSCODING_SERVICE_TOKEN)
    private readonly _transcodingService: IVideoTranscodingService,
    @Inject(ASSET_REPO_TOKEN)
    private readonly _assetRepo: IAssetRepository,
    private readonly _assetPathService: AssetPathService,
  ) {}

  /**
   * Triggers video transcoding after asset confirmation.
   * Called by the AssetConfirmed Kafka consumer for VIDEO assets.
   *
   * Flow:
   * 1. Look up variant definitions for the asset's purpose
   * 2. Build the HLS output path based on the original key
   * 3. Generate a webhook token for security
   * 4. Create a Coconut transcoding job
   * 5. Transition asset to PROCESSING with transcodingId in metadata
   */
  async processVideo(input: ProcessVideoInput): Promise<void> {
    if (input.assetType !== ASSET_TYPE.VIDEO) {
      this._logger.debug(`Skipping non-video asset: ${input.assetId}`);
      return;
    }

    const variants = VIDEO_VARIANTS[input.purpose];
    if (!variants || variants.length === 0) {
      this._logger.warn(
        `No video variants defined for purpose: ${input.purpose}, skipping transcoding`,
      );
      return;
    }

    const asset = await this._assetRepo.findById(input.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${input.assetId} not found`);
    }

    const sourceUrl = this._storageService.getPublicUrl(input.key);
    const outputPath = this._assetPathService.generateVariantPrefix(input.key);
    const webhookToken = randomUUID();
    const coconutVariants = buildCoconutVariants(variants);

    // Create transcoding job via Coconut
    const { jobId } = await this._transcodingService.createTranscodingJob({
      sourceUrl,
      outputPath,
      variants: coconutVariants,
      segmentDuration: HLS_SEGMENT_DURATION,
      webhookToken,
    });

    // Transition asset: CONFIRMED → PROCESSING
    asset.startProcessing(jobId);

    // Store webhook token in metadata for verification
    const currentMetadata = asset.metadata ?? {};
    // We need to set the token directly since startProcessing already set metadata
    // The token is stored alongside transcodingId
    Object.assign(currentMetadata, { webhookToken });

    await this._assetRepo.update(asset);

    this._logger.log(
      `Video transcoding started for asset ${input.assetId}, Coconut job: ${jobId}`,
    );
  }

  /**
   * Handles Coconut webhook callbacks.
   * Updates asset status based on the transcoding result.
   *
   * Security: The webhook token is verified against the one stored in metadata.
   */
  async handleWebhook(input: HandleTranscodingWebhookInput): Promise<void> {
    this._logger.log(
      `Received Coconut webhook: status=${input.status}, jobId=${input.jobId}`,
    );

    if (input.status !== 'job.completed' && input.status !== 'job.failed') {
      this._logger.debug(`Ignoring non-terminal status: ${input.status}`);
      return;
    }

    const asset = await this._assetRepo.findByTranscodingId(input.jobId);
    if (!asset) {
      this._logger.warn(
        `No asset found for Coconut job: ${input.jobId}, ignoring webhook`,
      );
      return;
    }

    // Verify webhook token
    const storedToken = asset.metadata?.webhookToken as string | undefined;
    if (!storedToken || storedToken !== input.token) {
      this._logger.warn(
        `Invalid webhook token for asset ${asset.id}, ignoring`,
      );
      return;
    }

    if (input.status === 'job.completed') {
      asset.markAsReady(this._extractOutputUrls(input.outputs));
      this._logger.log(
        `Video transcoding completed for asset ${asset.id}`,
      );
    } else {
      const failureReason = this._extractFailureReason(input.outputs);
      asset.markAsFailed(failureReason);
      this._logger.error(
        `Video transcoding failed for asset ${asset.id}: ${failureReason}`,
      );
    }

    await this._assetRepo.update(asset);
  }

  /**
   * Extracts playback and thumbnail URLs from Coconut output.
   * Returns a map like: { hlsUrl: "...", thumbnailUrl: "..." }
   */
  private _extractOutputUrls(
    outputs?: CoconutOutput[],
  ): Record<string, string> | undefined {
    if (!outputs || outputs.length === 0) return undefined;

    const urls: Record<string, string> = {};

    for (const output of outputs) {
      const outputUrl = output.url ?? output.urls?.[0];
      if (!outputUrl) continue;

      if (output.type === 'httpstream') {
        urls.hlsUrl = outputUrl;
      }

      if (output.type === 'image') {
        urls.thumbnailUrl = outputUrl;
      }
    }

    return Object.keys(urls).length > 0 ? urls : undefined;
  }

  /**
   * Extracts a failure reason from Coconut outputs.
   */
  private _extractFailureReason(outputs?: CoconutOutput[]): string {
    if (!outputs) return 'Transcoding failed';

    const failedOutput = outputs.find((o) =>
      o.status?.toLowerCase().includes('error'),
    );
    return failedOutput
      ? `Transcoding failed: ${failedOutput.key} - ${failedOutput.status}`
      : 'Transcoding failed';
  }
}
