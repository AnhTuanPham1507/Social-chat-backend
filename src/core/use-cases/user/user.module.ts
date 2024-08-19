import { Module } from '@nestjs/common';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { CreateUserUseCase } from './create-user.use-case';
import { PostgresModule } from 'src/frameworks/data-services/postgres/postgres.module';

@Module({
    imports: [PostgresModule],
    providers: [
        {
            provide: DIToken.CREATE_USER_USE_CASE,
            useClass: CreateUserUseCase,
        },
    ],
    exports: [DIToken.CREATE_USER_USE_CASE],
})
export class UserModule {}
