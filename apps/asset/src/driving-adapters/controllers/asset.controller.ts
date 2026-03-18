import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '@social-chat/common';

import {
  ASSET_APPLICATION_SERVICE_TOKEN,
  IAssetApplicationService,
} from '../../application/application-services/asset.application-service';
import ENDPOINT from '../constants/endpoint.constant';
import {
  PresignUploadRequestDTO,
  PresignUploadResponseDTO,
  ConfirmUploadResponseDTO,
  BulkPresignUploadRequestDTO,
  BulkPresignUploadResponseDTO,
} from '../dtos/presign-upload.dto';
import {
  ResizeImageRequestDTO,
  ResizeImageResponseDTO,
} from '../dtos/resize-image.dto';
import {
  InitiateMultipartUploadRequestDTO,
  InitiateMultipartUploadResponseDTO,
  CompleteMultipartUploadRequestDTO,
  CompleteMultipartUploadResponseDTO,
  AbortMultipartUploadRequestDTO,
} from '../dtos/multipart-upload.dto';

@Controller(ENDPOINT.ASSET.BASE)
@ApiTags('Assets')
// @UseGuards(JwtGuard)
@ApiBearerAuth()
export class AssetController {
  constructor(
    @Inject(ASSET_APPLICATION_SERVICE_TOKEN)
    private readonly _assetAppService: IAssetApplicationService,
  ) {}

  /**
   * Step 1: Client requests a pre-signed PUT URL for direct upload to R2.
   * Returns the URL the client uses to PUT the file body directly.
   */
  @Post(ENDPOINT.ASSET.PRESIGN_UPLOAD)
  @HttpCode(HttpStatus.CREATED)
  async presignUpload(
    @Req() req: Request & { user?: any },
    @Body() dto: PresignUploadRequestDTO,
  ): Promise<PresignUploadResponseDTO> {
    // const userId = req.user?.sub as string;
    const userId = '9882e956-1252-4df2-a8d6-c151198eab34'

    const result = await this._assetAppService.presignUpload({
      purpose: dto.purpose,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
      createdBy: userId,
    });

    return {
      assetId: result.assetId,
      uploadUrl: result.uploadUrl,
      key: result.key,
    };
  }

  /**
   * Bulk presign upload: request multiple presigned URLs in a single call.
   * Useful for uploading multiple files at once (e.g., multiple images in a post).
   * Max 20 items per request.
   */
  @Post(ENDPOINT.ASSET.BULK_PRESIGN_UPLOAD)
  @HttpCode(HttpStatus.CREATED)
  async bulkPresignUpload(
    @Req() req: Request & { user?: any },
    @Body() dto: BulkPresignUploadRequestDTO,
  ): Promise<BulkPresignUploadResponseDTO> {
    const userId = req.user?.sub as string;

    const items = await this._assetAppService.bulkPresignUpload(
      dto.items.map((item) => ({
        purpose: item.purpose,
        originalName: item.originalName,
        mimeType: item.mimeType,
        size: item.size,
        createdBy: userId,
      })),
    );

    return { items };
  }

  /**
   * Step 3: Client confirms the upload is complete.
   * Verifies file exists in R2, transitions asset to CONFIRMED.
   */
  @Post(ENDPOINT.ASSET.CONFIRM)
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Param('assetId') assetId: string,
  ): Promise<ConfirmUploadResponseDTO> {
    const result = await this._assetAppService.confirmUpload(assetId);

    return {
      assetId: result.assetId,
      key: result.key,
      url: result.url,
    };
  }

  /**
   * Resize an image asset on demand.
   * Returns cached variant URL if it already exists, otherwise generates it synchronously.
   * If no resize options provided, returns the original asset URL.
   */
  @Post(ENDPOINT.ASSET.RESIZE)
  @HttpCode(HttpStatus.OK)
  async resizeImage(
    @Param('assetId') assetId: string,
    @Body() dto: ResizeImageRequestDTO,
  ): Promise<ResizeImageResponseDTO> {
    const hasOptions = dto.width ?? dto.height ?? dto.resizingType ?? dto.quality ?? dto.format;

    return this._assetAppService.resizeImage({
      assetId,
      variant: hasOptions ? dto : undefined,
    });
  }

  /**
   * Initiate a multipart upload for large files (videos).
   * Returns an uploadId and presigned URLs for each part.
   */
  @Post(ENDPOINT.ASSET.INITIATE_MULTIPART)
  @HttpCode(HttpStatus.CREATED)
  async initiateMultipartUpload(
    @Req() req: Request & { user?: any },
    @Body() dto: InitiateMultipartUploadRequestDTO,
  ): Promise<InitiateMultipartUploadResponseDTO> {
    const userId = req.user?.sub as string;

    return this._assetAppService.initiateMultipartUpload({
      purpose: dto.purpose,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
      totalParts: dto.totalParts,
      createdBy: userId,
    });
  }

  /**
   * Complete a multipart upload.
   * Combines parts, verifies the file, and transitions asset to CONFIRMED.
   */
  @Post(ENDPOINT.ASSET.COMPLETE_MULTIPART)
  @HttpCode(HttpStatus.OK)
  async completeMultipartUpload(
    @Param('assetId') assetId: string,
    @Body() dto: CompleteMultipartUploadRequestDTO,
  ): Promise<CompleteMultipartUploadResponseDTO> {
    return this._assetAppService.completeMultipartUpload({
      assetId,
      uploadId: dto.uploadId,
      parts: dto.parts,
    });
  }

  /**
   * Abort a multipart upload and clean up.
   */
  @Post(ENDPOINT.ASSET.ABORT_MULTIPART)
  @HttpCode(HttpStatus.NO_CONTENT)
  async abortMultipartUpload(
    @Param('assetId') assetId: string,
    @Body() dto: AbortMultipartUploadRequestDTO,
  ): Promise<void> {
    await this._assetAppService.abortMultipartUpload(assetId, dto.uploadId);
  }

  /**
   * Deletes an asset. Only the creator can delete their own assets.
   */
  @Delete(ENDPOINT.ASSET.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAsset(
    @Req() req: Request & { user?: any },
    @Param('assetId') assetId: string,
  ): Promise<void> {
    const userId = req.user?.sub as string;

    await this._assetAppService.deleteAsset(assetId, userId);
  }
}
