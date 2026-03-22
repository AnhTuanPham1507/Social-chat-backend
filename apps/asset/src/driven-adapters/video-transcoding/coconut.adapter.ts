import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  COCONUT_CONFIG,
  ICoconutConfig,
  IR2Config,
  R2_CONFIG,
} from '@social-chat/common';
import {
  CreateTranscodingJobInput,
  CreateTranscodingJobOutput,
  IVideoTranscodingService,
} from '../../application/contracts/video-transcoding-service.contract';

/**
 * Driven adapter that calls the Coconut.co V2 API for video transcoding.
 *
 * Coconut downloads the source from R2, transcodes into HLS variants,
 * and uploads the output directly back to R2.
 */
@Injectable()
export class CoconutAdapter implements IVideoTranscodingService {
  private readonly _logger = new Logger(CoconutAdapter.name);
  private readonly _apiKey: string;
  private readonly _webhookBaseUrl: string;
  private readonly _r2Config: IR2Config;

  constructor(private readonly _configService: ConfigService) {
    const coconutConfig = this._configService.get<ICoconutConfig>(COCONUT_CONFIG);
    this._apiKey = coconutConfig.apiKey;
    this._webhookBaseUrl = coconutConfig.webhookUrl;
    this._r2Config = this._configService.get<IR2Config>(R2_CONFIG);
  }

  async createTranscodingJob(
    input: CreateTranscodingJobInput,
  ): Promise<CreateTranscodingJobOutput> {
    const body = {
      input: {
        url: input.sourceUrl,
      },
      storage: {
        service: 's3other',
        endpoint: `https://${this._r2Config.accountId}.r2.cloudflarestorage.com`,
        bucket: this._r2Config.bucket,
        region: 'auto',
        credentials: {
          access_key_id: this._r2Config.accessKeyId,
          secret_access_key: this._r2Config.secretAccessKey,
        },
        path: `/${input.outputPath}`,
      },
      notification: {
        type: 'http',
        url: `${this._webhookBaseUrl}?token=${input.webhookToken}`,
        events: true,
        metadata: true,
      },
      outputs: {
        httpstream: {
          hls: {
            path: '/hls',
            segment_duration: input.segmentDuration,
          },
          variants: input.variants,
        },
        'jpg:160x90': {
          path: '/thumbnails/thumbs_%05d.jpg',
          interval: 2,
          sprite: {
            columns: 10,
            limit: 100,
          },
          vtt: {
            filename: 'thumbnails.vtt',
          },
        },
      },
    };

    this._logger.log(
      `Creating Coconut transcoding job for: ${input.outputPath}`,
    );

    const response = await axios.post(
      'https://api.coconut.co/v2/jobs',
      body,
      {
        auth: {
          username: this._apiKey,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    const jobId = response.data.id;

    this._logger.log(
      `Coconut job created: ${jobId} for path: ${input.outputPath}`,
    );

    return { jobId: String(jobId) };
  }
}
