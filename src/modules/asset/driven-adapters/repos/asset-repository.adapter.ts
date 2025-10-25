import { BaseAssetRepository } from '@infras/database/repos/asset.repository';
import { IAssetRepository } from '@modules/asset/application/contracts/asset-repository.contract';
import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { ASSET_MAPPER_TOKEN, IAssetMapper } from '../../mappers';

@Injectable()
export class AssetRepo implements IAssetRepository {
    constructor(
        @Inject(ASSET_MAPPER_TOKEN)
        private readonly _assetMapper: IAssetMapper,
        private readonly _assetRepo: BaseAssetRepository,
    ) {}

    public async insert(asset: AssetEntity): Promise<void> {
        const assetModel = this._assetMapper.fromEntityToModel(asset);
        const createdAsset = await this._assetRepo.create(assetModel);

        if (!createdAsset) {
            throw new InternalServerErrorException("Can't create asset");
        }
    }
}
