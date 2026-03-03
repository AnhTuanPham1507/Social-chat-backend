import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { MIME_TYPE } from './mime-type.value-object';
import { ASSET_TYPE } from './asset-type.value-object';
import { ASSET_STATUS } from './asset-status.enum';
import { AssetSize } from './asset-size.value-object';

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
  status: ASSET_STATUS;
}

/**
 * Props for creating a new asset (pre-signed upload request).
 * Size is validated via AssetSize value object.
 */
export interface CreateAssetProps {
  bucket: string;
  key: string;
  originalName: string;
  mimeType: MIME_TYPE;
  size: number;
  assetType: ASSET_TYPE;
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
  status: ASSET_STATUS;
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
    // Validate size (throws MaxAssetSizeException if too large)
    AssetSize.fromNumber(props.size);

    return new AssetEntity({
      bucket: props.bucket,
      key: props.key,
      originalName: props.originalName,
      mimeType: props.mimeType,
      size: props.size,
      assetType: props.assetType,
      status: ASSET_STATUS.PENDING,
    });
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
        status: props.status,
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

  get isConfirmed(): boolean {
    return this._props.status === ASSET_STATUS.CONFIRMED;
  }

  // ============================================
  // Behavior Methods
  // ============================================

  /**
   * Confirms the asset after the file has been verified in object storage.
   * Transitions status from PENDING to CONFIRMED.
   */
  confirm(): void {
    if (this._props.status === ASSET_STATUS.CONFIRMED) {
      return;
    }

    this._props.status = ASSET_STATUS.CONFIRMED;
    this.markAsUpdated();
  }
}
