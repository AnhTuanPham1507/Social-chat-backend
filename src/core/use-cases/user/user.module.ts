import { Module } from '@nestjs/common';
import { DIToken } from '../../../core/enums/di-tokens.enum';
import { CreateUserUseCase } from './create-user.use-case';
@Module({
    imports: [],
    providers: [
        {
            provide: DIToken.CREATE_USER_USE_CASE,
            useClass: CreateUserUseCase,
        },
    ],
    exports: [DIToken.CREATE_USER_USE_CASE],
})
export class UserModule {}
