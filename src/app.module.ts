import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './core/modules/user/user.module';
import { AuthModule } from './core/modules/auth/auth.module';
import { RabbitMQModule } from './infras/message-broker/rabbitmq.module';
import { PostgresModule } from './infras/database/postgres.module';
import { HashDataModule } from './infras/hash-data/hash-data.module';
import { TokenModule } from './infras/token/token.module';
import { MinioServiceModule } from './infras/object-storage/minio.module';
import { FileUploadInterceptor } from './core/interceptors/fileUpload.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
        MinioServiceModule,
        UserModule,
        AuthModule,
    ],
    providers: [
        // {
        //     provide: APP_INTERCEPTOR,
        //     useClass: FileUploadInterceptor, // Register the interceptor here
        // },
    ],
})
export class AppModule {}
