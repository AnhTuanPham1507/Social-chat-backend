import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

import { VideoProcessingApplicationService } from '../../application/application-services/video-processing.application-service';
import ENDPOINT from '../constants/endpoint.constant';
import { mapCoconutWebhookBody } from '../dtos/coconut-webhook.dto';

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
   * Validation is bypassed — Coconut sends snake_case keys that don't
   * match our camelCase conventions. We map manually instead.
   *
   * Security: Each job has a unique token passed as query param.
   * The application service verifies it against the stored token in asset metadata.
   */
  @Post(ENDPOINT.WEBHOOK.COCONUT)
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @UsePipes()
  async handleCoconutWebhook(
    @Query('token') token: string,
    @Body() rawBody: Record<string, any>,
  ): Promise<{ received: boolean }> {
    const body = mapCoconutWebhookBody(rawBody);
    const { data } = body;

    this._logger.log(
      `Coconut webhook received: event=${body.event}, jobId=${data.id}, status=${data.status}`,
    );

    await this._videoProcessingService.handleWebhook({
      status: data.status,
      jobId: data.id,
      token: token ?? '',
      outputs: data.outputs,
      progress: data.progress,
    });

    return { received: true };
  }
}
