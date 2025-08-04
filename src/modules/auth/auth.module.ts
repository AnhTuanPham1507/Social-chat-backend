import { AssetModule } from '@modules/asset/asset.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    AuthApplicationService,
} from './application/application-services/auth.application-service';
import { ACCOUNT_REPO_TOKEN } from './application/contracts/account-repository.contract';
import { ASSET_SERVICE_TOKEN } from './application/contracts/asset-service.contract';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { AuthHelper } from './auth.helper';
import { AccountRepo } from './driven-adapters/repos/account-repository.adapter';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';
import { AssetServiceAdapter } from './driven-adapters/services/asset-service.adapter';
import { AuthController } from './driving-adapters/controllers/auth.controller';
import { AuthWebHook } from './driving-adapters/controllers/auth.web-hook';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';

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
    controllers: [AuthController, AuthWebHook],
    providers: [
        {
            provide: AUTH_APPLICATION_SERVICE_TOKEN,
            useClass: AuthApplicationService,
        },
        {
            provide: ACCOUNT_REPO_TOKEN,
            useClass: AccountRepo,
        },
        {
            provide: ASSET_SERVICE_TOKEN,
            useClass: AssetServiceAdapter,
        },
        {
            provide: USER_REPO_TOKEN,
            useClass: UserRepo,
        },
        AuthHelper,
        LocalStrategy,
        GoogleStrategy,
    ],
})
export class AuthModule {}
