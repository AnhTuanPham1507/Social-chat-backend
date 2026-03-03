import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  ASSET_APPLICATION_SERVICE_TOKEN,
  IAssetApplicationService,
} from '../../application/application-services/asset.application-service';
import ENDPOINT from '../constants/endpoint.constant';
import {
  PresignUploadRequestDTO,
  PresignUploadResponseDTO,
  ConfirmUploadResponseDTO,
} from '../dtos/presign-upload.dto';

@Controller(ENDPOINT.ASSET.BASE)
@ApiTags('Assets')
export class AssetController {
  constructor(
    @Inject(ASSET_APPLICATION_SERVICE_TOKEN)
    private readonly _assetAppService: IAssetApplicationService,
  ) {}

  /**
   * Step 1: Client requests a pre-signed POST URL for direct upload to MinIO.
   * Returns the URL + form fields the client needs to include in the POST.
   */
  @Post(ENDPOINT.ASSET.PRESIGN_UPLOAD)
  @HttpCode(HttpStatus.CREATED)
  async presignUpload(
    @Body() dto: PresignUploadRequestDTO,
  ): Promise<PresignUploadResponseDTO> {
    const result = await this._assetAppService.presignUpload({
      bucket: dto.bucket,
      folder: dto.folder,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
    });

    return {
      assetId: result.assetId,
      postURL: result.postURL,
      formData: result.formData,
      key: result.key,
    };
  }

  /**
   * Step 3: Client confirms the upload is complete.
   * Verifies file exists in MinIO, transitions asset to CONFIRMED.
   */
  @Post(ENDPOINT.ASSET.CONFIRM)
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Param('assetId') assetId: string,
  ): Promise<ConfirmUploadResponseDTO> {
    const result = await this._assetAppService.confirmUpload(assetId);

    return {
      assetId: result.assetId,
      bucket: result.bucket,
      key: result.key,
      url: result.url,
    };
  }
}
