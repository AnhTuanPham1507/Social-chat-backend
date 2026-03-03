import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { MIME_TYPE } from '@social-chat/domain';

export class PresignUploadRequestDTO {
  @ApiProperty({ example: 'avatars' })
  @IsString()
  bucket: string;

  @ApiProperty({ example: 'avatars' })
  @IsString()
  folder: string;

  @ApiProperty({ example: 'my-photo.jpg' })
  @IsString()
  originalName: string;

  @ApiProperty({ enum: MIME_TYPE, example: MIME_TYPE.JPEG })
  @IsEnum(MIME_TYPE)
  mimeType: MIME_TYPE;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024)
  size: number;
}

export class PresignUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  postURL: string;

  @ApiProperty()
  formData: Record<string, string>;

  @ApiProperty()
  key: string;
}

export class ConfirmUploadResponseDTO {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  bucket: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;
}
