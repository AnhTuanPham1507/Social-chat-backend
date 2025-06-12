import { generateHash, validateHashString } from '@commons/utils/hash.util';
import { ASSET_TYPE } from '@modules/asset/domain/entities/asset/asset-type.value-object';
import { ACCOUNT_PROVIDER } from '@modules/auth/domain/entities/account/account-provider.value-object';
import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';
import { AvatarEntity } from '@modules/auth/domain/entities/account/avatar.entity';
import { ROLE } from '@modules/auth/domain/entities/account/role.value-object';
import { UserEntity } from '@modules/auth/domain/entities/user/user.entity';
import AccountDTO from '@modules/auth/driving-adapters/dtos/account.dto';
import { GoogleLoginPayloadDTO } from '@modules/auth/driving-adapters/dtos/google-login-payload.dto';
import { LoginPayloadDTO } from '@modules/auth/driving-adapters/dtos/login-payload.dto';
import { Inject, Injectable } from '@nestjs/common';

import { Transactional } from 'typeorm-transactional';

import {
    ACCOUNT_REPO_TOKEN,
    IAccountRepository,
} from '../contracts/account-repository.contract';

import {
    ASSET_SERVICE_TOKEN,
    IAssetService,
} from '../contracts/asset-service.contract';
import {
    IUserRepository,
    USER_REPO_TOKEN,
} from '../contracts/user-repository.contract';
import {
    AccountNotFoundException,
    InvalidCredentialsException,
} from '../exceptions/auth.exception';
import RegisterPayloadDTO from '@modules/auth/driving-adapters/dtos/register-payload.dto';

export const AUTH_APPLICATION_SERVICE_TOKEN = 'AUTH_APPLICATION_SERVICE_TOKEN';

export interface IAuthApplicationService {
    googleLogin(
        payload?: GoogleLoginPayloadDTO,
        actor?: string,
    ): Promise<AccountDTO>;
    localLogin(payload?: LoginPayloadDTO, actor?: string): Promise<AccountDTO>;
    register(payload: RegisterPayloadDTO): Promise<void>;
}

@Injectable()
export class AuthApplicationService implements IAuthApplicationService {
    constructor(
        @Inject(ACCOUNT_REPO_TOKEN)
        private readonly _accountRepo: IAccountRepository,
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        @Inject(ASSET_SERVICE_TOKEN)
        private readonly _assetService: IAssetService,
    ) {}

    async googleLogin(payload?: GoogleLoginPayloadDTO): Promise<AccountDTO> {
        const account = AccountEntity.create({
            email: payload.email,
            provider: ACCOUNT_PROVIDER.GOOGLE,
        });

        const foundAccount = await this._accountRepo.findOne({
            email: account.email,
            provider: account.provider,
        });
        if (foundAccount) {
            return new AccountDTO(foundAccount);
        }

        await this._accountRepo.insert(account);
        return new AccountDTO(account);
    }

    async localLogin(payload?: LoginPayloadDTO): Promise<AccountDTO> {
        const account = AccountEntity.create({
            email: payload.email,
            password: payload.password,
        });

        const foundAccount = await this._accountRepo.findOne({
            email: account.email.value,
            provider: account.provider.value,
        });
        if (!foundAccount) {
            throw new AccountNotFoundException();
        }

        const isSamePassword = await validateHashString(
            payload.password,
            foundAccount.password.value,
        );
        if (!isSamePassword) {
            throw new InvalidCredentialsException();
        }

        return new AccountDTO(foundAccount);
    }

    @Transactional()
    public async register(payload: RegisterPayloadDTO) {
        const createdAvatar = await this._assetService.createAsset({
            ...payload.avatar,
            assetType: ASSET_TYPE.IMAGE,
        });

        const hashedPassword = generateHash(payload.password);

        const accountEntity = AccountEntity.create({
            email: payload.email,
            password: hashedPassword,
            role: ROLE.USER,
            provider: ACCOUNT_PROVIDER.LOCAL,
            owner: UserEntity.create({
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                sex: payload.sex,
            }),
            avatar: AvatarEntity.create({
                id: createdAvatar.id,
                url: createdAvatar.url.value,
            }),
        });

        await this._userRepo.insert(accountEntity.owner);
        await this._accountRepo.insert(accountEntity);
    }
}
