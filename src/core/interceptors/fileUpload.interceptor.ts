import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();

        // Assuming you're uploading the file via `multipart/form-data`
        const file = request.file; // For single file
        // const files = request.files; // For multiple files

        if (file) {
            // Ensure the bucket exists or create it
            const bucketName = 'my-bucket';
            await this.minioService.ensureBucketExists(bucketName);

            // Upload the file to Minio
            const objectName = file.originalname;
            const fileBuffer = file.buffer;
            const contentType = file.mimetype;

            await this.minioService.uploadFile(
                bucketName,
                objectName,
                fileBuffer,
                contentType,
            );

            // Add file URL to the request or response if necessary
            request.body.fileUrl = `http://YOUR_MINIO_ENDPOINT/${bucketName}/${objectName}`;
        }

        return next.handle();
    }
}