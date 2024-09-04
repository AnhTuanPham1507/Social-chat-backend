import { MimeType } from "../enums/mime-type.enum";

export type IUploadFilePayload = {
    fileBuffer: Buffer;
    fileName: string;
    fileSize: number;
    mimetype: MimeType;
}
export type IUploadFileResponsePayload = {
    path: string;
}
export interface IObjectStorageService {
    uploadFile(
        payload: IUploadFilePayload,
    ): Promise<IUploadFileResponsePayload>;
}