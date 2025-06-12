import { Module } from '@nestjs/common';
import { AssetService } from './application/asset.service';
import { LocalGuard } from '../../commons/guards/local.guard';
import { MinioModule } from '@infras/minio/minio.module';
import { UploadFileService } from './driven-adapters/services/upload-file-service.adapter';
import { AssetRepo } from './driven-adapters/repos/asset-repository.adapter';
import { UPLOAD_FILE_SERVICE_TOKEN } from './application/contracts/upload-file-service.contract';
import { ASSET_REPO_TOKEN } from './application/contracts/asset-repository.contract';

@Module({
  imports: [MinioModule],
  providers: [
    AssetService,
    LocalGuard,
    {
      provide: UPLOAD_FILE_SERVICE_TOKEN,
      useClass: UploadFileService,
    },
    {
      provide: ASSET_REPO_TOKEN,
      useClass: AssetRepo,
    },
  ],
  exports: [AssetService],
})
export class AssetModule {} 