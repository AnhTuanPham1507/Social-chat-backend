import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './core/modules/user/user.module';
import { AuthModule } from './core/modules/auth/auth.module';
import { RabbitMQModule } from './infras/message-broker/rabbitmq.module';
import { PostgresModule } from './infras/database/postgres.module';
import { HashDataModule } from './infras/hash-data/hash-data.module';
import { TokenModule } from './infras/token/token.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.development.env`,
        }),
        PostgresModule,
        RabbitMQModule,
        HashDataModule,
        TokenModule,
        UserModule,
        AuthModule,
    ],
    providers: [],
})
export class AppModule {}
