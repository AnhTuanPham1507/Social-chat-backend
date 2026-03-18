import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  IImageProcessingService,
  ProcessImageParams,
  ProcessImageResult,
} from '../../application/contracts/image-processing-service.contract';

/**
 * Driven adapter that calls the custom imgproxy API.
 *
 * imgproxy downloads the original from sourceUrl,
 * processes it, and uploads the result to presignedUrl.
 */
@Injectable()
export class ImgproxyAdapter implements IImageProcessingService {
  private readonly logger = new Logger(ImgproxyAdapter.name);
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('IMGPROXY_URL', 'http://localhost:8080');
    this.secret = this.configService.getOrThrow<string>('IMGPROXY_SECRET');
  }

  async processImage(params: ProcessImageParams): Promise<ProcessImageResult> {
    const response = await axios.post(
      `${this.baseUrl}/api/v1/process`,
      {
        source_url: params.sourceUrl,
        presigned_url: params.presignedUrl,
        processing: {
          width: params.width,
          height: params.height,
          resizing_type: params.resizingType,
          quality: params.quality,
          format: params.format,
          strip_metadata: true,
          auto_rotate: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    const metadata = response.data.metadata;

    this.logger.debug(
      `Image processed: ${metadata.result_width}x${metadata.result_height} ${metadata.format} (${metadata.size} bytes)`,
    );

    return {
      format: metadata.format,
      size: metadata.size,
      originWidth: metadata.origin_width,
      originHeight: metadata.origin_height,
      resultWidth: metadata.result_width,
      resultHeight: metadata.result_height,
    };
  }
}
