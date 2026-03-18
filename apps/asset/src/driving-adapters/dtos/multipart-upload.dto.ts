import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ASSET_PURPOSE, MIME_TYPE } from '@social-chat/domain';

// ============================================
// Initiate Multipart Upload
// ============================================

export class InitiateMultipartUploadRequestDTO {
  @ApiProperty({ enum: ASSET_PURPOSE, example: ASSET_PURPOSE.POST })
  @IsEnum(ASSET_PURPOSE)
  purpose: ASSET_PURPOSE;

  @ApiProperty({ example: 'video.mp4' })
  @IsString()
  originalName: string;

  @ApiProperty({ enum: MIME_TYPE, example: MIME_TYPE.MP4 })
  @IsEnum(MIME_TYPE)
  mimeType: MIME_TYPE;

  @ApiProperty({ example: 52428800, description: 'Total file size in bytes' })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({
    example: 10,
    description: 'Number of parts to split the file into (1-10000)',
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  totalParts: number;
}

export class InitiateMultipartUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  uploadId: string;

  @ApiProperty({ type: [Object] })
  partUrls: { partNumber: number; url: string }[];
}

// ============================================
// Complete Multipart Upload
// ============================================

export class CompletedPartDTO {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  partNumber: number;

  @ApiProperty({ example: '"etag-value"' })
  @IsString()
  etag: string;
}

export class CompleteMultipartUploadRequestDTO {
  @ApiProperty({ description: 'The upload ID from initiate response' })
  @IsString()
  uploadId: string;

  @ApiProperty({ type: [CompletedPartDTO] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompletedPartDTO)
  parts: CompletedPartDTO[];
}

export class CompleteMultipartUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;
}

// ============================================
// Abort Multipart Upload
// ============================================

export class AbortMultipartUploadRequestDTO {
  @ApiProperty({ description: 'The upload ID from initiate response' })
  @IsString()
  uploadId: string;
}
