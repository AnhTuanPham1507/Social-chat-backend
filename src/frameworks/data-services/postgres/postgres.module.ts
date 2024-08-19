import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import InitConfiguration from './configuration';
import { UserModel } from './models/user.model';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { UserRepo } from './repositories/user.repository';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => InitConfiguration(),
        }),
        TypeOrmModule.forFeature([UserModel]),
    ],
    providers: [
        {
            provide: DIToken.USER_REPOSITORY,
            useClass: UserRepo,
        },
    ],
    exports: [DIToken.USER_REPOSITORY], // Export the provider if needed
})
export class PostgresModule {}
