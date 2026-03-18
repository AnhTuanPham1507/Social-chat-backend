import { ASSET_PURPOSE } from './asset-purpose.enum';

export enum RESIZING_TYPE {
  FIT = 'fit',
  FILL = 'fill',
  FILL_DOWN = 'fill-down',
  FORCE = 'force',
  AUTO = 'auto',
}

export enum IMAGE_FORMAT {
  WEBP = 'webp',
  JPEG = 'jpeg',
  PNG = 'png',
  AVIF = 'avif',
}

export interface ImageVariantDefinition {
  width?: number;
  height?: number;
  resizingType: RESIZING_TYPE;
  quality: number;
  format: IMAGE_FORMAT;
}

/**
 * Predefined image variants per purpose.
 * Variant key is derived from these params: w{width}-h{height}-{resizingType}-q{quality}
 * Example: w64-h64-fill-q80.webp
 */
export const IMAGE_VARIANTS: Record<ASSET_PURPOSE, ImageVariantDefinition[]> = {
  [ASSET_PURPOSE.AVATAR]: [
    { width: 64, height: 64, resizingType: RESIZING_TYPE.FILL, quality: 80, format: IMAGE_FORMAT.WEBP },
    { width: 256, height: 256, resizingType: RESIZING_TYPE.FILL, quality: 80, format: IMAGE_FORMAT.WEBP },
  ],
  [ASSET_PURPOSE.POST]: [
    { width: 640, height: 640, resizingType: RESIZING_TYPE.FIT, quality: 80, format: IMAGE_FORMAT.WEBP },
    { width: 1080, height: 1080, resizingType: RESIZING_TYPE.FIT, quality: 85, format: IMAGE_FORMAT.WEBP },
  ],
  [ASSET_PURPOSE.CHAT_ATTACHMENT]: [
    { width: 320, height: 320, resizingType: RESIZING_TYPE.FIT, quality: 75, format: IMAGE_FORMAT.WEBP },
  ],
  [ASSET_PURPOSE.COVER_PHOTO]: [
    { width: 820, height: 312, resizingType: RESIZING_TYPE.FILL, quality: 85, format: IMAGE_FORMAT.WEBP },
    { width: 1640, height: 624, resizingType: RESIZING_TYPE.FILL, quality: 85, format: IMAGE_FORMAT.WEBP },
  ],
};

/**
 * Default optimized format for image conversion.
 */
export const DEFAULT_OPTIMIZED_FORMAT = IMAGE_FORMAT.WEBP;
export const DEFAULT_OPTIMIZED_QUALITY = 80;
export const DEFAULT_FULL_QUALITY = 100;

/**
 * Per-purpose file size thresholds (in bytes) for quality reduction.
 * Images above the threshold get reduced quality; below get format conversion only.
 */
export const IMAGE_OPTIMIZE_THRESHOLD: Partial<Record<ASSET_PURPOSE, number>> = {
  [ASSET_PURPOSE.AVATAR]: 200 * 1024,        // 200 KB
  [ASSET_PURPOSE.CHAT_ATTACHMENT]: 300 * 1024, // 300 KB
  [ASSET_PURPOSE.POST]: 500 * 1024,           // 500 KB
  [ASSET_PURPOSE.COVER_PHOTO]: 500 * 1024,    // 500 KB
};

export const IMAGE_OPTIMIZE_THRESHOLD_DEFAULT = 500 * 1024; // 500 KB

/**
 * Builds the variant key string from a variant definition.
 * Example: w64-h64-fill-q80
 */
export function buildVariantKey(variant: ImageVariantDefinition): string {
  const parts: string[] = [];
  if (variant.width) parts.push(`w${variant.width}`);
  if (variant.height) parts.push(`h${variant.height}`);
  parts.push(variant.resizingType, `q${variant.quality}`);
  return parts.join('-');
}
