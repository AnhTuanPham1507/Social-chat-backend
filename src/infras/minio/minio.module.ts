import { Global, Module } from '@nestjs/common';

import { MinioClientProvider } from './minio-client';
import { MinioService } from './minio.service';

@Module({
    providers: [MinioClientProvider, MinioService],
    exports: [MinioService],
})
@Global()
export class MinioModule {}
