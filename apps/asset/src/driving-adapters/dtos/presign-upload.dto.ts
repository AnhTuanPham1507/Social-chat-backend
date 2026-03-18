import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ASSET_PURPOSE, MIME_TYPE } from '@social-chat/domain';

export class PresignUploadRequestDTO {
  @ApiProperty({ enum: ASSET_PURPOSE, example: ASSET_PURPOSE.AVATAR })
  @IsEnum(ASSET_PURPOSE)
  purpose: ASSET_PURPOSE;

  @ApiProperty({ example: 'my-photo.jpg' })
  @IsString()
  originalName: string;

  @ApiProperty({ enum: MIME_TYPE, example: MIME_TYPE.JPEG })
  @IsEnum(MIME_TYPE)
  mimeType: MIME_TYPE;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  size: number;
}

export class PresignUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  key: string;
}

export class ConfirmUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;
}

// ============================================
// Bulk Presign Upload
// ============================================

export class BulkPresignUploadRequestDTO {
  @ApiProperty({ type: [PresignUploadRequestDTO], maxItems: 20 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PresignUploadRequestDTO)
  items: PresignUploadRequestDTO[];
}

export class BulkPresignUploadResponseDTO {
  @ApiProperty({ type: [PresignUploadResponseDTO] })
  items: PresignUploadResponseDTO[];
}

export class ValidateAssetRequestDTO {
  @ApiProperty({ example: 'avatars/uuid-123.jpg', description: 'Object key of the asset' })
  @IsString()
  key: string;
}

export class ValidateAssetResponseDTO {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  assetId: string;

  @ApiProperty()
  key: string;
}
