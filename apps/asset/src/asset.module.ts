import { Module } from '@nestjs/common';

import {
  ASSET_APPLICATION_SERVICE_TOKEN,
  AssetApplicationService,
} from './application/application-services/asset.application-service';
import { ASSET_REPO_TOKEN } from './application/contracts/asset-repository.contract';
import { OBJECT_STORAGE_SERVICE_TOKEN } from './application/contracts/object-storage-service.contract';
import { AssetRepo } from './driven-adapters/repos/asset-repository.adapter';
import { MinioStorageAdapter } from './driven-adapters/storage/minio-storage.adapter';
import { AssetController } from './driving-adapters/controllers/asset.controller';

@Module({
  controllers: [AssetController],
  providers: [
    {
      provide: ASSET_APPLICATION_SERVICE_TOKEN,
      useClass: AssetApplicationService,
    },
    {
      provide: ASSET_REPO_TOKEN,
      useClass: AssetRepo,
    },
    {
      provide: OBJECT_STORAGE_SERVICE_TOKEN,
      useClass: MinioStorageAdapter,
    },
  ],
  exports: [ASSET_APPLICATION_SERVICE_TOKEN],
})
export class AssetModule {}
