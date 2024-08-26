import { Module } from '@nestjs/common';
import { DIToken } from '../../../core/enums/di-tokens.enum';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { UserController } from './user.controller';
import { GetOneUserUseCase } from './use-cases/get-one-user.use-case';

@Module({
    providers: [
        {
            provide: DIToken.CREATE_USER_USE_CASE,
            useClass: CreateUserUseCase,
        },
        {
            provide: DIToken.GET_ONE_USER_USE_CASE,
            useClass: GetOneUserUseCase,
        },
    ],
    controllers: [UserController],
    exports: [DIToken.CREATE_USER_USE_CASE, DIToken.GET_ONE_USER_USE_CASE],
})
export class UserModule {}
