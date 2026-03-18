import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ASSET_TYPE,
  ASSET_PURPOSE,
  MIME_TYPE,
  type ImageVariantDefinition,
  buildVariantKey,
} from '@social-chat/domain';

export interface ParsedObjectKey {
  purpose: ASSET_PURPOSE;
  type: ASSET_TYPE;
  userId: string;
  assetId: string;
  filename: string;
}

const MIME_EXTENSION_MAP = new Map<string, string>([
  [MIME_TYPE.JPEG, 'jpg'],
  [MIME_TYPE.PNG, 'png'],
  [MIME_TYPE.GIF, 'gif'],
  [MIME_TYPE.WEBP, 'webp'],
  [MIME_TYPE.SVG, 'svg'],
  [MIME_TYPE.TIFF, 'tiff'],
  [MIME_TYPE.BMP, 'bmp'],
  [MIME_TYPE.MP4, 'mp4'],
  [MIME_TYPE.WEBM, 'webm'],
  [MIME_TYPE.OGG_VIDEO, 'ogg'],
  [MIME_TYPE.AVI, 'avi'],
  [MIME_TYPE.MPEG, 'mpeg'],
  [MIME_TYPE.QUICKTIME, 'mov'],
  [MIME_TYPE.MP3, 'mp3'],
  [MIME_TYPE.WAV, 'wav'],
  [MIME_TYPE.OGG_AUDIO, 'ogg'],
  [MIME_TYPE.WEBM_AUDIO, 'webm'],
  [MIME_TYPE.FLAC, 'flac'],
  [MIME_TYPE.AAC, 'aac'],
  [MIME_TYPE.PDF, 'pdf'],
  [MIME_TYPE.ZIP, 'zip'],
  [MIME_TYPE.PLAIN_TEXT, 'txt'],
  [MIME_TYPE.JSON, 'json'],
  [MIME_TYPE.CSV, 'csv'],
  [MIME_TYPE.HTML, 'html'],
]);

/**
 * AssetPathService - Object key generation and parsing for asset storage.
 *
 * Path patterns:
 * - Original:       {type}/{purpose}/{userId}/{assetId}/{sanitized-filename}.{ext}
 * - Image variant:  {type}/{purpose}/{userId}/{assetId}/{variant}.{format}
 *
 * Extension is derived from MIME type to ensure consistency.
 */
@Injectable()
export class AssetPathService {
  /**
   * Generate object key for original file upload.
   * Pattern: {type}/{purpose}/{userId}/{assetId}/{sanitized-filename}.{ext}
   */
  generateOriginalKey(
    assetId: string,
    userId: string,
    purpose: ASSET_PURPOSE,
    mimeType: MIME_TYPE,
    originalFilename: string,
  ): string {
    const type = this.deriveAssetType(mimeType);
    const ext = this._mimeToExtension(mimeType);
    const sanitized = this._sanitizeFilename(originalFilename);
    return `${type}/${purpose}/${userId}/${assetId}/${sanitized}.${ext}`;
  }

  /**
   * Generate variant key from original key.
   * image/avatar/user-123/uuid/my-photo.jpg → image/avatar/user-123/uuid/my-photo-w64-h64-fill-q80.webp
   */
  generateVariantKey(
    originalKey: string,
    variant: ImageVariantDefinition,
  ): string {
    const assetDir = originalKey.substring(0, originalKey.lastIndexOf('/'));
    const filename = originalKey.substring(originalKey.lastIndexOf('/') + 1);
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const variantSuffix = buildVariantKey(variant);
    return `${assetDir}/${nameWithoutExt}-${variantSuffix}.${variant.format}`;
  }

  /**
   * Replace extension on an object key.
   * image/avatar/user-123/uuid/my-photo.jpg → image/avatar/user-123/uuid/my-photo.webp
   */
  replaceExtension(objectKey: string, newExt: string): string {
    const baseKey = objectKey.replace(/\.[^./]+$/, '');
    return `${baseKey}.${newExt}`;
  }

  /**
   * Parse an object key to extract its components.
   * {type}/{purpose}/{userId}/{assetId}/filename
   */
  parseObjectKey(objectKey: string): ParsedObjectKey {
    const parts = objectKey.split('/');
    const type = parts[0] as ASSET_TYPE;
    const purpose = parts[1] as ASSET_PURPOSE;
    const userId = parts[2];
    const assetId = parts[3];
    const filename = parts[4];

    return { type, purpose, userId, assetId, filename };
  }

  /**
   * Generate prefix for listing all files (original + variants) of an asset.
   * image/avatar/user-123/uuid/my-photo.jpg → image/avatar/user-123/uuid
   */
  generateVariantPrefix(objectKey: string): string {
    const parsed = this.parseObjectKey(objectKey);
    return `${parsed.type}/${parsed.purpose}/${parsed.userId}/${parsed.assetId}`;
  }

  /**
   * Derive asset type from MIME type.
   */
  deriveAssetType(mimeType: string): ASSET_TYPE {
    if (mimeType.startsWith('image/')) return ASSET_TYPE.IMAGE;
    if (mimeType.startsWith('video/')) return ASSET_TYPE.VIDEO;
    if (mimeType.startsWith('audio/')) return ASSET_TYPE.AUDIO;
    return ASSET_TYPE.DOCUMENT;
  }

  /**
   * Sanitize original filename for use in object key.
   * Transliterates Vietnamese diacritics, strips extension, slugifies.
   * "Ảnh đại diện (2).png" → "anh-dai-dien-2"
   */
  private _sanitizeFilename(filename: string): string {
    const withoutExt = filename.replace(/\.[^.]+$/, '');
    return this._removeVietnameseDiacritics(withoutExt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private _removeVietnameseDiacritics(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  private _mimeToExtension(mimeType: string): string {
    const ext = MIME_EXTENSION_MAP.get(mimeType.toLowerCase());
    if (!ext) {
      throw new BadRequestException(`Unsupported MIME type: ${mimeType}`);
    }
    return ext;
  }
}
