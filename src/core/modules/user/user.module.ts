import { Module } from '@nestjs/common';
import { DIToken } from '../../../core/enums/di-tokens.enum';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { UserController } from './user.controller';

@Module({
    providers: [
        {
            provide: DIToken.CREATE_USER_USE_CASE,
            useClass: CreateUserUseCase,
        },
    ],
    controllers: [UserController],
    exports: [DIToken.CREATE_USER_USE_CASE],
})
export class UserModule {}
