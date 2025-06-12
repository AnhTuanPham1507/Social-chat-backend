import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';
import { PostgresAssetRepository } from '@infras/postgres/repositories/asset.repository';
import { IAssetRepository } from '@modules/asset/application/contracts/asset-repository.contract';

@Injectable()
export class AssetRepo  implements IAssetRepository {
    constructor(
        private _assetRepo: PostgresAssetRepository,
    ) {}


    async insert(asset: AssetEntity): Promise<void> {    
        const createdAsset = await this._assetRepo.insert({
           ...asset.toObject(),
        });

        if(!createdAsset) {
            throw new InternalServerErrorException("Can't create asset");
        }
    }
}
