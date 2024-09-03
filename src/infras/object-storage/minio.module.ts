import { Module } from "@nestjs/common";
import { DIToken } from "src/core/enums/di-tokens.enum";
import { MinioService } from "./minio.service";

@Module({
    providers: [
        {
            provide: DIToken.OBJECT_STORAGE_SERVICE,
            useClass: MinioService
        }
    ],
    exports: [DIToken.OBJECT_STORAGE_SERVICE]
})
export class MinioServiceModule {}