import RegisterPayloadDTO from '@modules/auth/driving-adapters/dtos/auth.dto';
import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import {
    ASSET_SERVICE_TOKEN,
    IAssetService,
} from '../contracts/asset-service.contract';
import {
    IAM_SERVICE_TOKEN,
    IIAMService,
} from '../contracts/iam-service.contract';
import {
    IUserRepository,
    USER_REPO_TOKEN,
} from '../contracts/user-repository.contract';
import { IUserMapper, USER_MAPPER_TOKEN } from '../mappers';

export const AUTH_APPLICATION_SERVICE_TOKEN = 'AUTH_APPLICATION_SERVICE_TOKEN';

export interface IAuthApplicationService {
    signUpByEmail(payload: RegisterPayloadDTO): Promise<void>;
}

@Injectable()
export class AuthApplicationService implements IAuthApplicationService {
    constructor(
        @Inject(ASSET_SERVICE_TOKEN)
        private readonly _assetService: IAssetService,
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        @Inject(USER_MAPPER_TOKEN)
        private readonly _userMapper: IUserMapper,
        @Inject(IAM_SERVICE_TOKEN)
        private readonly _iamService: IIAMService,
    ) {}

    @Transactional()
    public async signUpByEmail(payload: RegisterPayloadDTO): Promise<void> {
        let uploadedAvatarUrl = payload.avatar
            ? await this._assetService.upload(payload.avatar)
            : null;

        const userEntity = this._userMapper.fromPropsToEntity({
            ...payload,
            avatarUrl: uploadedAvatarUrl,
        });

        await Promise.all([
            this._userRepo.insert(userEntity),
            this._iamService.createUser({
                email: payload.email,
                fullName: payload.fullName,
                phone: payload.phone,
            }),
        ]);
    }
}
