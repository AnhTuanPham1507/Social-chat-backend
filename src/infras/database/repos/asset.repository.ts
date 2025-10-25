import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AssetModel } from '../models/asset.model';

import { BaseRepository } from './base-repository';

@Injectable()
export class BaseAssetRepository extends BaseRepository<AssetModel> {
    constructor(
        @InjectRepository(AssetModel)
        assetRepository: Repository<AssetModel>,
    ) {
        super(assetRepository);
    }
}
