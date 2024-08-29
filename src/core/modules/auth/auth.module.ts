import { Module } from '@nestjs/common';
import { DIToken } from '../../enums/di-tokens.enum';
import { LoginUseCase } from './use-cases/login.use-case';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleLoginUseCase } from './use-cases/google-login.use-case';

@Module({
    imports: [PassportModule],
    controllers: [AuthController],
    providers: [
        {
            provide: DIToken.LOGIN_USE_CASE,
            useClass: LoginUseCase,
        },
        {
            provide: DIToken.GOOGLE_LOGIN_USE_CASE,
            useClass: GoogleLoginUseCase,
        },
        LocalStrategy,
        GoogleStrategy,
    ],
})
export class AuthModule {}
