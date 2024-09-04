import { BadRequestException, CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { DIToken } from "../enums/di-tokens.enum";
import { IObjectStorageService, IUploadFilePayload } from "../interfaces/object-storage-service.interface";
import { Request } from 'express';
import { MimeType } from "../enums/mime-type.enum";
import { AssetType } from "../enums/asset-type.enum";
import { UploadedAssetDTO } from "../dtos/uploadedAsset.dto";

export class FileUploadInterceptor implements NestInterceptor {
    constructor(
        @Inject(DIToken.OBJECT_STORAGE_SERVICE)
        private readonly objectStorageService: IObjectStorageService,
    ) {}

    private convertMimeTypeToAssetType(mimetype: string): AssetType {
        const type = mimetype.split('/')[0];

        switch (type) {
            case 'image':
                return AssetType.IMAGE;

            case 'video':
                return AssetType.VIDEO;

            case 'audio':
                return AssetType.AUDIO;

            case 'text':
            case 'application':
                return AssetType.DOCUMENT;

            default:
                return AssetType.OTHER;
        }
    }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();
        const file = request.file;

        if (!file) {
            throw new BadRequestException('File is not found');
        }

        const fileName = file.originalname;
        const fileBuffer = file.buffer;
        const mimetype = file.mimetype as MimeType;
        const fileSize = file.size;
        const assetType = this.convertMimeTypeToAssetType(mimetype);

        const uploadFilePayload: IUploadFilePayload = {
            fileBuffer,
            fileName,
            fileSize,
            mimetype,
        };
        const {path: filePath} = await this.objectStorageService.uploadFile(
            uploadFilePayload,
        );

        request['uploadedFile'] = new UploadedAssetDTO(mimetype, assetType, fileSize, fileName, filePath);
        
        return next.handle();
    }
}