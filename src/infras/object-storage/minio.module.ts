import { Global, Module } from "@nestjs/common";
import { DIToken } from "src/core/enums/di-tokens.enum";
import { MinioService } from "./minio.service";
import { MulterModule } from "@nestjs/platform-express";
import { MulterConfigService } from "./multer.service";
import { FileUploadInterceptor } from "src/core/interceptors/fileUpload.interceptor";

@Module({
    imports: [
        MulterModule.registerAsync({
            useClass: MulterConfigService,
        }),
    ],
    providers: [
        {
            provide: DIToken.OBJECT_STORAGE_SERVICE,
            useClass: MinioService,
        },
        FileUploadInterceptor
    ],
    exports: [DIToken.OBJECT_STORAGE_SERVICE],
})
@Global()
export class MinioServiceModule {}