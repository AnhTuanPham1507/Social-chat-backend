import { BadRequestException, CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { DIToken } from "../enums/di-tokens.enum";
import { IObjectStorageService } from "../interfaces/object-storage-service.interface";
import { Request } from 'express';
import { MimeType } from "../enums/mime-type.enum";

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
    constructor(
        @Inject(DIToken.OBJECT_STORAGE_SERVICE)
        private readonly objectStorageService: IObjectStorageService
    ){}
    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();
        const file = request.file; 
        
        if (!file) {
            throw new BadRequestException('File is not found');
        }   


        // Upload the file to Minio
        const fileName = file.originalname;
        const fileBuffer = file.buffer;
        const mimetype = file.mimetype;
        const fileSize = file.size;

        await this.objectStorageService.uploadFile(
            fileBuffer,
            fileName,
            fileSize,
            mimetype as MimeType,
        );

        return next.handle();
    }
}