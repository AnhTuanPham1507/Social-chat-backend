import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { MIME_TYPE } from './mime-type.value-object';
import { ASSET_TYPE } from './asset-type.value-object';
import { ASSET_PURPOSE } from './asset-purpose.enum';
import { ASSET_STATUS } from './asset-status.enum';
import { AssetSize } from './asset-size.value-object';
import { AssetConfirmedEvent } from './events/asset-confirmed.event';

/**
 * Flexible metadata whose shape is determined by asset type.
 * - VIDEO: { transcodingId: string; failureReason?: string }
 * - IMAGE: could hold optimization info in the future
 */
export type AssetMetadata = Record<string, unknown>;

/**
 * Internal props for the Asset aggregate.
 */
interface AssetProps {
  bucket: string;
  key: string;
  originalName: string;
  mimeType: MIME_TYPE;
  size: number;
  assetType: ASSET_TYPE;
  purpose: ASSET_PURPOSE;
  status: ASSET_STATUS;
  createdBy: string;
  metadata: AssetMetadata | null;
}

/**
 * Props for creating a new asset (pre-signed upload request).
 * Size is validated via AssetSize value object.
 */
export interface CreateAssetProps {
  id?: UUID;
  bucket: string;
  key: string;
  originalName: string;
  mimeType: MIME_TYPE;
  size: number;
  assetType: ASSET_TYPE;
  purpose: ASSET_PURPOSE;
  createdBy: string;
}

/**
 * Props for reconstituting an asset from persistence.
 */
export interface ReconstituteAssetProps {
  id: UUID;
  bucket: string;
  key: string;
  originalName: string;
  mimeType: MIME_TYPE;
  size: number;
  assetType: ASSET_TYPE;
  purpose: ASSET_PURPOSE;
  status: ASSET_STATUS;
  createdBy: string;
  metadata: AssetMetadata | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class AssetEntity extends AggregateRoot<AssetProps> {
  // ============================================
  // Factory Methods
  // ============================================

  private constructor(props: AssetProps, id?: UUID) {
    super(props, id);
  }

  /**
   * Creates a new asset in PENDING status.
   * Called when generating a pre-signed upload URL.
   * Validates file size via AssetSize value object.
   */
  static create(props: CreateAssetProps): AssetEntity {
    // Validate size against type/purpose limits
    AssetSize.create(props.size, props.assetType, props.purpose);

    return new AssetEntity(
      {
        bucket: props.bucket,
        key: props.key,
        originalName: AssetEntity._sanitizeFilename(props.originalName),
        mimeType: props.mimeType,
        size: props.size,
        assetType: props.assetType,
        purpose: props.purpose,
        status: ASSET_STATUS.PENDING,
        createdBy: props.createdBy,
        metadata: null,
      },
      props.id,
    );
  }

  /**
   * Sanitize filename: transliterate Vietnamese diacritics, slugify, preserve extension.
   * "Ảnh đại diện (2).png" → "anh-dai-dien-2.png"
   */
  private static _sanitizeFilename(filename: string): string {
    const dotIndex = filename.lastIndexOf('.');
    const name = dotIndex >= 0 ? filename.substring(0, dotIndex) : filename;
    const ext = dotIndex >= 0 ? filename.substring(dotIndex) : '';

    const slugified = AssetEntity._removeVietnameseDiacritics(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${slugified}${ext.toLowerCase()}`;
  }

  private static _removeVietnameseDiacritics(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Reconstitutes an asset from persistence.
   * Does not validate or emit events.
   */
  static reconstitute(props: ReconstituteAssetProps): AssetEntity {
    const asset = new AssetEntity(
      {
        bucket: props.bucket,
        key: props.key,
        originalName: props.originalName,
        mimeType: props.mimeType,
        size: props.size,
        assetType: props.assetType,
        purpose: props.purpose,
        status: props.status,
        createdBy: props.createdBy,
        metadata: props.metadata,
      },
      props.id,
    );
    asset.setTimestamps(props.createdAt, props.updatedAt, props.deletedAt);
    return asset;
  }

  // ============================================
  // Getters
  // ============================================

  get bucket(): string {
    return this._props.bucket;
  }

  get key(): string {
    return this._props.key;
  }

  get originalName(): string {
    return this._props.originalName;
  }

  get mimeType(): MIME_TYPE {
    return this._props.mimeType;
  }

  get size(): number {
    return this._props.size;
  }

  get assetType(): ASSET_TYPE {
    return this._props.assetType;
  }

  get status(): ASSET_STATUS {
    return this._props.status;
  }

  get purpose(): ASSET_PURPOSE {
    return this._props.purpose;
  }

  get createdBy(): string {
    return this._props.createdBy;
  }

  get metadata(): AssetMetadata | null {
    return this._props.metadata;
  }

  get isConfirmed(): boolean {
    return this._props.status === ASSET_STATUS.CONFIRMED;
  }

  get isReady(): boolean {
    return this._props.status === ASSET_STATUS.READY;
  }

  get isProcessing(): boolean {
    return this._props.status === ASSET_STATUS.PROCESSING;
  }

  get isAvailable(): boolean {
    return (
      this._props.status === ASSET_STATUS.CONFIRMED ||
      this._props.status === ASSET_STATUS.READY
    );
  }

  // ============================================
  // Behavior Methods
  // ============================================

  /**
   * Confirms the asset after the file has been verified in object storage.
   * Transitions status from PENDING to CONFIRMED.
   * Idempotent: no-op if already past CONFIRMED (PROCESSING, READY).
   */
  confirm(): void {
    if (this._props.status !== ASSET_STATUS.PENDING) {
      return;
    }

    this._props.status = ASSET_STATUS.CONFIRMED;
    this.markAsUpdated();
    this.addDomainEvent(
      new AssetConfirmedEvent(
        this.id,
        this.bucket,
        this.key,
        this.assetType,
        this.purpose,
        this.mimeType,
        this.size,
        this.createdBy,
      ),
    );
  }

  /**
   * Marks the asset as being processed by an external transcoding service.
   * Only VIDEO assets can transition to PROCESSING.
   * Guards: must be CONFIRMED, must be VIDEO type.
   */
  startProcessing(transcodingId: string): void {
    if (this._props.status !== ASSET_STATUS.CONFIRMED) {
      throw new Error(
        `Cannot start processing: asset is in "${this._props.status}" status, expected "confirmed"`,
      );
    }
    if (this._props.assetType !== ASSET_TYPE.VIDEO) {
      throw new Error(
        `Cannot start processing: asset type "${this._props.assetType}" does not support transcoding`,
      );
    }

    this._props.status = ASSET_STATUS.PROCESSING;
    this._props.metadata = {
      ...this._props.metadata,
      transcodingId,
    };
    this.markAsUpdated();
  }

  /**
   * Marks the asset as ready after transcoding completes successfully.
   * Optionally stores output URLs (HLS, thumbnail) in metadata.
   * Guards: must be PROCESSING.
   */
  markAsReady(outputUrls?: Record<string, string>): void {
    if (this._props.status !== ASSET_STATUS.PROCESSING) {
      throw new Error(
        `Cannot mark as ready: asset is in "${this._props.status}" status, expected "processing"`,
      );
    }

    this._props.status = ASSET_STATUS.READY;
    if (outputUrls) {
      this._props.metadata = {
        ...this._props.metadata,
        ...outputUrls,
      };
    }
    this.markAsUpdated();
  }

  /**
   * Marks the asset as failed after transcoding fails.
   * Stores the failure reason in metadata for debugging.
   * Guards: must be PROCESSING.
   */
  markAsFailed(reason?: string): void {
    if (this._props.status !== ASSET_STATUS.PROCESSING) {
      throw new Error(
        `Cannot mark as failed: asset is in "${this._props.status}" status, expected "processing"`,
      );
    }

    this._props.status = ASSET_STATUS.FAILED;
    this._props.metadata = {
      ...this._props.metadata,
      failureReason: reason ?? 'Unknown error',
    };
    this.markAsUpdated();
  }
}
