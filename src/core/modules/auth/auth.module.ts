import { Module } from '@nestjs/common';
import { DIToken } from '../../enums/di-tokens.enum';
import { LogInUseCase } from './use-cases/login.use-case';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';

@Module({
    imports: [PassportModule],
    controllers: [AuthController],
    providers: [
        {
            provide: DIToken.LOGIN_USE_CASE,
            useClass: LogInUseCase,
        },
        LocalStrategy,
    ],
})
export class AuthModule {}
