import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ASSET_PURPOSE,
  ASSET_TYPE,
  IMAGE_VARIANTS,
  IMAGE_OPTIMIZE_THRESHOLD,
  IMAGE_OPTIMIZE_THRESHOLD_DEFAULT,
  DEFAULT_OPTIMIZED_FORMAT,
  DEFAULT_OPTIMIZED_QUALITY,
  DEFAULT_FULL_QUALITY,
  IMAGE_FORMAT,
  RESIZING_TYPE,
  type ImageVariantDefinition,
} from '@social-chat/domain';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE_TOKEN,
} from '../contracts/object-storage-service.contract';
import {
  IImageProcessingService,
  IMAGE_PROCESSING_SERVICE_TOKEN,
} from '../contracts/image-processing-service.contract';
import { AssetPathService } from './asset-path.service';

export const IMAGE_PROCESSING_APP_SERVICE_TOKEN = Symbol('IMAGE_PROCESSING_APP_SERVICE');

export interface ProcessAssetInput {
  assetId: string;
  key: string;
  assetType: ASSET_TYPE;
  purpose: ASSET_PURPOSE;
  mimeType: string;
  size: number;
}

@Injectable()
export class ImageProcessingApplicationService {
  private readonly logger = new Logger(ImageProcessingApplicationService.name);

  constructor(
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
    @Inject(IMAGE_PROCESSING_SERVICE_TOKEN)
    private readonly _imageProcessingService: IImageProcessingService,
    private readonly _assetPathService: AssetPathService,
  ) {}

  /**
   * Processes a confirmed image asset:
   * 1. Optimize original → WebP copy (format conversion ± quality reduction)
   * 2. Generate predefined variants per purpose (thumbnails, resized copies)
   */
  async processAsset(input: ProcessAssetInput): Promise<void> {
    if (input.assetType !== ASSET_TYPE.IMAGE) {
      this.logger.debug(`Skipping non-image asset: ${input.assetId}`);
      return;
    }

    const sourceUrl = this._storageService.getPublicUrl(input.key);

    // Step 1: Default WebP optimization
    await this._optimizeOriginal(input, sourceUrl);

    // Step 2: Generate predefined variants
    const variants = IMAGE_VARIANTS[input.purpose];
    if (!variants || variants.length === 0) {
      this.logger.debug(`No variants defined for purpose: ${input.purpose}`);
      return;
    }

    this.logger.log(
      `Processing ${variants.length} variants for asset ${input.assetId} (${input.purpose})`,
    );

    await Promise.all(
      variants.map((variant) => this._generateVariant(input, sourceUrl, variant)),
    );

    this.logger.log(`All variants generated for asset ${input.assetId}`);
  }

  /**
   * Generates a single image variant on demand.
   * Used by the resize API — checks R2 cache first, generates if missing.
   *
   * All variant fields are optional — defaults applied here:
   * - width/height: 0 (keep original dimension)
   * - resizingType: FIT
   * - quality: 80
   * - format: WEBP
   *
   * Returns { url, variantKey }.
   */
  async resizeImage(
    key: string,
    options: Partial<ImageVariantDefinition>,
  ): Promise<{ url: string; variantKey: string }> {
    const variant: ImageVariantDefinition = {
      width: options.width,
      height: options.height,
      resizingType: options.resizingType ?? RESIZING_TYPE.FIT,
      quality: options.quality ?? DEFAULT_OPTIMIZED_QUALITY,
      format: options.format ?? DEFAULT_OPTIMIZED_FORMAT,
    };

    const variantKey = this._assetPathService.generateVariantKey(key, variant);

    // Cache check — skip processing if variant already exists in R2
    const exists = await this._storageService.verifyFileExists(variantKey);
    if (exists) {
      this.logger.debug(`Variant cache hit: ${variantKey}`);
      return {
        url: this._storageService.getPublicUrl(variantKey),
        variantKey,
      };
    }

    this.logger.debug(`Variant cache miss: ${variantKey}, processing via imgproxy`);

    const sourceUrl = this._storageService.getPublicUrl(key);
    const presignedUrl = await this._storageService.generatePresignedPutUrl({
      key: variantKey,
      contentType: `image/${variant.format}`,
    });

    await this._imageProcessingService.processImage({
      sourceUrl,
      presignedUrl,
      width: variant.width,
      height: variant.height,
      resizingType: variant.resizingType,
      quality: variant.quality,
      format: variant.format,
    });

    this.logger.log(`On-demand variant generated: ${variantKey}`);
    return {
      url: this._storageService.getPublicUrl(variantKey),
      variantKey,
    };
  }

  /**
   * Optimize original image to WebP format.
   *
   * Quality depends on file size relative to purpose-specific threshold:
   * - Below threshold → quality 100 (format conversion only, no quality loss)
   * - Above threshold → quality 80 (format + quality reduction)
   *
   * Skips if the original is already WebP and below threshold.
   */
  private async _optimizeOriginal(
    input: ProcessAssetInput,
    sourceUrl: string,
  ): Promise<void> {
    const optimizedKey = this._assetPathService.replaceExtension(
      input.key,
      DEFAULT_OPTIMIZED_FORMAT,
    );

    const threshold =
      IMAGE_OPTIMIZE_THRESHOLD[input.purpose] ?? IMAGE_OPTIMIZE_THRESHOLD_DEFAULT;
    const shouldReduceQuality = input.size > threshold;

    // Skip if already WebP and no quality reduction needed
    if (optimizedKey === input.key && !shouldReduceQuality) {
      this.logger.debug(`Skipping optimization for already-optimized asset: ${input.assetId}`);
      return;
    }

    const quality = shouldReduceQuality
      ? DEFAULT_OPTIMIZED_QUALITY
      : DEFAULT_FULL_QUALITY;

    const presignedUrl = await this._storageService.generatePresignedPutUrl({
      key: optimizedKey,
      contentType: `image/${DEFAULT_OPTIMIZED_FORMAT}`,
    });

    await this._imageProcessingService.processImage({
      sourceUrl,
      presignedUrl,
      width: 0,
      height: 0,
      resizingType: RESIZING_TYPE.AUTO,
      quality,
      format: DEFAULT_OPTIMIZED_FORMAT,
    });

    this.logger.log(
      `Optimized image ${input.assetId} (q${quality}): ${input.key} → ${optimizedKey}`,
    );
  }

  private async _generateVariant(
    input: ProcessAssetInput,
    sourceUrl: string,
    variant: ImageVariantDefinition,
  ): Promise<void> {
    const variantKey = this._assetPathService.generateVariantKey(input.key, variant);

    const presignedUrl = await this._storageService.generatePresignedPutUrl({
      key: variantKey,
      contentType: `image/${variant.format}`,
    });

    await this._imageProcessingService.processImage({
      sourceUrl,
      presignedUrl,
      width: variant.width,
      height: variant.height,
      resizingType: variant.resizingType,
      quality: variant.quality,
      format: variant.format,
    });

    this.logger.debug(`Variant generated: ${variantKey}`);
  }
}
