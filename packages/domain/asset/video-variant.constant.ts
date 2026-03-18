import { ASSET_PURPOSE } from './asset-purpose.enum';

export interface VideoVariantDefinition {
  resolution: string;
  maxBitrate: string;
  quality?: number;
}

/**
 * Predefined HLS variants per purpose.
 * Format follows Coconut's variant spec: mp4:{resolution}::maxrate={bitrate}
 *
 * Resolution ladder based on common ABR best practices:
 * - 360p: Low bandwidth / mobile fallback
 * - 480p: Standard mobile
 * - 720p: Desktop / good mobile
 * - 1080p: Full HD desktop
 */
export const VIDEO_VARIANTS: Partial<Record<ASSET_PURPOSE, VideoVariantDefinition[]>> = {
  [ASSET_PURPOSE.POST]: [
    { resolution: '360p', maxBitrate: '800k' },
    { resolution: '480p', maxBitrate: '1500k' },
    { resolution: '720p', maxBitrate: '3000k' },
    { resolution: '1080p', maxBitrate: '5000k' },
  ],
  [ASSET_PURPOSE.CHAT_ATTACHMENT]: [
    { resolution: '360p', maxBitrate: '800k' },
    { resolution: '720p', maxBitrate: '2500k' },
  ],
};

/**
 * Default HLS segment duration in seconds.
 * 4s is a good balance between latency and encoding efficiency.
 */
export const HLS_SEGMENT_DURATION = 4;

/**
 * Build Coconut variant strings from definitions.
 * Example: ["mp4:360p::maxrate=800k", "mp4:720p::maxrate=3000k"]
 */
export function buildCoconutVariants(variants: VideoVariantDefinition[]): string[] {
  return variants.map((v) => {
    const params = [`maxrate=${v.maxBitrate}`];
    if (v.quality) params.push(`quality=${v.quality}`);
    return `mp4:${v.resolution}::${params.join(',')}`;
  });
}
