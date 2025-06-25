import { ApiProperty } from '@nestjs/swagger';
import { ASSET_TYPE } from '@modules/asset/domain/entities/asset/asset-type.value-object';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';

export class CreateAssetPayloadDTO {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File buffer data',
        example: 'Binary file data'
    })
    fileBuffer: Buffer;

    @ApiProperty({
        type: 'string',
        description: 'Original filename',
        example: 'avatar.jpg'
    })
    fileName: string;

    @ApiProperty({
        type: 'number',
        description: 'File size in bytes',
        example: 1024
    })
    fileSize: number;

    @ApiProperty({
        enum: MIME_TYPE,
        description: 'MIME type of the file',
        example: MIME_TYPE.GIF
    })
    mimeType: MIME_TYPE;

    @ApiProperty({
        enum: ASSET_TYPE,
        description: 'Type of asset',
        example: ASSET_TYPE.IMAGE
    })
    assetType: ASSET_TYPE;
}
