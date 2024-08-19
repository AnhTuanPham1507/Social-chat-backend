import { Module } from '@nestjs/common';
import { PostgresModule } from './frameworks/data-services/postgres/postgres.module';
import { UserController } from './presentation/controllers/user.controller';
import { UserModule } from './core/use-cases/user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PostgresModule, UserModule, ConfigModule.forRoot()],
    controllers: [UserController],
    providers: [],
})
export class AppModule {}
