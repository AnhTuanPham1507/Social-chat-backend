import { ASSET_TYPE } from "@modules/asset/domain/entities/asset/asset-type.value-object";
import { MIME_TYPE } from "@modules/asset/domain/entities/asset/mime-type.value-object";

export class CreateAssetPayloadDTO {
    fileBuffer: Buffer;
    fileName: string;
    fileSize: number;
    mimeType: MIME_TYPE;
    assetType: ASSET_TYPE;
}