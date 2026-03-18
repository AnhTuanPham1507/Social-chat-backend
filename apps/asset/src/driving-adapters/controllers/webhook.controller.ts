import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { VideoProcessingApplicationService } from '../../application/application-services/video-processing.application-service';
import ENDPOINT from '../constants/endpoint.constant';

/**
 * Webhook controller for receiving external service callbacks.
 *
 * No auth guard — webhook security is handled per-provider:
 * - Coconut: per-job unique token verified in application layer
 */
@Controller(ENDPOINT.WEBHOOK.BASE)
@ApiTags('Webhooks')
export class WebhookController {
  private readonly _logger = new Logger(WebhookController.name);

  constructor(
    private readonly _videoProcessingService: VideoProcessingApplicationService,
  ) {}

  /**
   * Coconut.co webhook endpoint.
   * Called when a transcoding job completes or fails.
   *
   * Security: Each job has a unique token passed as query param.
   * The application service verifies it against the stored token in asset metadata.
   */
  @Post(ENDPOINT.WEBHOOK.COCONUT)
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleCoconutWebhook(
    @Query('token') token: string,
    @Body() body: Record<string, any>,
  ): Promise<{ received: boolean }> {
    this._logger.log(
      `Coconut webhook received: status=${body.status}, id=${body.id}`,
    );

    await this._videoProcessingService.handleWebhook({
      status: body.status as string,
      jobId: String(body.id),
      token: token ?? '',
      outputs: body.outputs,
      progress: body.progress as string | undefined,
    });

    return { received: true };
  }
}
