import { Global, Module } from "@nestjs/common";
import { MinioService } from "./minio.service";
import { MinioClientProvider } from "./minio-client";

@Module({
    providers: [
        MinioClientProvider,
        MinioService
    ],
    exports: [MinioService]
})
@Global()
export class MinioModule {}