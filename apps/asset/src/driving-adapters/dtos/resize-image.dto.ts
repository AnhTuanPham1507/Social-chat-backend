import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IMAGE_FORMAT, RESIZING_TYPE } from '@social-chat/domain';

export class ResizeImageRequestDTO {
  @ApiPropertyOptional({ example: 200, description: 'Target width in pixels' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4096)
  width?: number;

  @ApiPropertyOptional({ example: 200, description: 'Target height in pixels' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4096)
  height?: number;

  @ApiPropertyOptional({ enum: RESIZING_TYPE })
  @IsOptional()
  @IsEnum(RESIZING_TYPE)
  resizingType?: RESIZING_TYPE;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ enum: IMAGE_FORMAT })
  @IsOptional()
  @IsEnum(IMAGE_FORMAT)
  format?: IMAGE_FORMAT;
}

export class ResizeImageResponseDTO {
  @ApiProperty()
  url: string;

  @ApiProperty()
  variantKey: string;
}
