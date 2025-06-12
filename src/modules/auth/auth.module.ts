import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './driving-adapters/strategies/local.strategy';
import { GoogleStrategy } from './driving-adapters/strategies/google.strategy';
import { AuthHelper } from './auth.helper';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_APPLICATION_SERVICE_TOKEN, AuthApplicationService } from './application/application-services/auth.application-service';
import { AuthController } from './driving-adapters/controllers/auth.controller';
import { AccountRepo } from './driven-adapters/repos/account-repository.adapter';
import { ACCOUNT_REPO_TOKEN } from './application/contracts/account-repository.contract';
import { ASSET_SERVICE_TOKEN } from './application/contracts/asset-service.contract';
import { AssetServiceAdapter } from './driven-adapters/services/asset-service.adapter';
import { AuthWebHook } from './driving-adapters/controllers/auth.web-hook';
import { AssetModule } from '@modules/asset/asset.module';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            global: true,
            secret: 'test',
            signOptions: { expiresIn: '60s' },
        }),
        AssetModule
    ],
    controllers: [AuthController, AuthWebHook],
    providers: [
        {
            provide: AUTH_APPLICATION_SERVICE_TOKEN,
            useClass: AuthApplicationService,
        },
        {
            provide: ACCOUNT_REPO_TOKEN,
            useClass: AccountRepo
        },
        {
            provide: ASSET_SERVICE_TOKEN,
            useClass: AssetServiceAdapter
        },
        {
            provide: USER_REPO_TOKEN,
            useClass: UserRepo
        },
        AuthHelper,
        LocalStrategy,
        GoogleStrategy,
    ],
})
export class AuthModule {}
