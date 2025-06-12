import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';

export const UPLOAD_FILE_SERVICE_TOKEN = Symbol('UPLOAD_FILE_SERVICE_TOKEN');

export interface IUploadFileService {
  uploadFile(payload: {
    fileBuffer: Buffer;
    fileName: string;
    fileSize: number;
    mimeType: MIME_TYPE;
  }): Promise<string>;
} 