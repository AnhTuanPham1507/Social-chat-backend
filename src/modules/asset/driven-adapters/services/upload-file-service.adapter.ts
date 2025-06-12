import { MinioService } from '@infras/minio/minio.service';
import { IUploadFileService } from '../../application/contracts/upload-file-service.contract';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadFileService implements IUploadFileService {
  constructor(private readonly minioService: MinioService) {}

  uploadFile(payload: { fileBuffer: Buffer; fileName: string; fileSize: number; mimeType: MIME_TYPE }): Promise<string> {
    const { fileBuffer, fileName, fileSize, mimeType } = payload;
    return this.minioService.uploadFile(fileBuffer, fileName, fileSize, mimeType);
  }
} 