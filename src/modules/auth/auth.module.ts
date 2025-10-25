import { API_CLIENTS } from '@infras/external-services';
import { AssetModule } from '@modules/asset/asset.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    AuthApplicationService,
} from './application/application-services/auth.application-service';
import { ASSET_SERVICE_TOKEN } from './application/contracts/asset-service.contract';
import { IAM_SERVICE_TOKEN } from './application/contracts/iam-service.contract';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { USER_MAPPER_TOKEN, UserMapper } from './application/mappers';
import { AuthHelper } from './auth.helper';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';
import { AssetServiceAdapter } from './driven-adapters/services/asset-service.adapter';
import { IAMServiceAdapter } from './driven-adapters/services/iam-service.adapter';
import { AuthController } from './driving-adapters/controllers/auth.controller';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            global: true,
            secret: 'test',
            signOptions: { expiresIn: '60s' },
        }),
        AssetModule,
    ],
    controllers: [AuthController],
    providers: [
        {
            provide: AUTH_APPLICATION_SERVICE_TOKEN,
            useClass: AuthApplicationService,
        },

        {
            provide: ASSET_SERVICE_TOKEN,
            useClass: AssetServiceAdapter,
        },
        {
            provide: USER_REPO_TOKEN,
            useClass: UserRepo,
        },

        {
            provide: USER_MAPPER_TOKEN,
            useClass: UserMapper,
        },
        {
            provide: IAM_SERVICE_TOKEN,
            useClass: IAMServiceAdapter,
        },
        AuthHelper,
        ...API_CLIENTS,
    ],
})
export class AuthModule {}
