import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            dismissDefaultMessages: false,
            validationError: {
                target: true,
            },
        }),
    );

    app.connectMicroservice<RmqOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [process.env.MQ_HOST],
            prefetchCount: 1,
            persistent: true,
            noAck: false,
            queueOptions: {
                durable: true,
            },
            socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
            },
        },
    });

    const config = new DocumentBuilder()
        .setTitle('Social chat APIs')
        .setDescription('Tài liệu API của website social chat')
        .setVersion('0.0.1')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/documentation', app, document);

    await app.listen(3000);
}
bootstrap();
