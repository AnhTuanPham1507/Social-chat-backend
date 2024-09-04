import { AssetType } from "../enums/asset-type.enum"
import { MimeType } from "../enums/mime-type.enum"

export class UploadedAssetDTO {
    mimetype: MimeType;
    assetType: AssetType;
    size: number;
    name: string;
    path: string;

    constructor(mimeType: MimeType, assetType: AssetType, size: number, name: string, path: string) {
        this.mimetype = mimeType;
        this.assetType = assetType;
        this.size = size;
        this.name = name;
        this.path = path;
    }
}