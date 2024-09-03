import { MimeType } from "../enums/mime-type.enum";

export interface IObjectStorageService {
    uploadFile(
        fileBuffer: Buffer, 
        fileName: string, 
        fileSize: number, 
        mimetype: MimeType, 
    ): Promise<void>;
}