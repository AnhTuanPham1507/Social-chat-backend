import { Module } from '@nestjs/common';
import { PostgresModule } from './frameworks/postgres/postgres.module';
import { UserController } from './presentation/controllers/user.controller';
import { UserModule } from './core/use-cases/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from './frameworks/rabbitmq/rabbitmq.module';
import { AuthModule } from './frameworks/auth/auth.module';

@Module({
    imports: [
        PostgresModule,
        RabbitMQModule,
        AuthModule,
        ConfigModule.forRoot({
            envFilePath: `.development.env`,
        }),
        UserModule,
    ],
    controllers: [UserController],
    providers: [],
})
export class AppModule {}
