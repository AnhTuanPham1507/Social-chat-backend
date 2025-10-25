import { MinioModule } from '@infras/minio/minio.module';
import { Module } from '@nestjs/common';

import { AssetService } from './application/asset.service';
import { ASSET_REPO_TOKEN } from './application/contracts/asset-repository.contract';
import { UPLOAD_FILE_SERVICE_TOKEN } from './application/contracts/upload-file-service.contract';
import { AssetRepo } from './driven-adapters/repos/asset-repository.adapter';
import { UploadFileService } from './driven-adapters/services/upload-file-service.adapter';
import { ASSET_MAPPER_TOKEN, AssetMapper } from './mappers';

@Module({
    imports: [MinioModule],
    providers: [
        AssetService,
        {
            provide: UPLOAD_FILE_SERVICE_TOKEN,
            useClass: UploadFileService,
        },
        {
            provide: ASSET_REPO_TOKEN,
            useClass: AssetRepo,
        },
        {
            provide: ASSET_MAPPER_TOKEN,
            useClass: AssetMapper,
        },
    ],
    exports: [AssetService],
})
export class AssetModule {}
