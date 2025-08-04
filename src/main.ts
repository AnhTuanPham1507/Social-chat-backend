import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module';

async function bootstrap() {
    initializeTransactionalContext();

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

    const config = new DocumentBuilder()
        .setTitle('Social chat APIs')
        .setDescription('Tài liệu API của website social chat')
        .setVersion('0.0.1')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/documentation', app, document);

    await app.startAllMicroservices();
    await app.listen(3000);
}
bootstrap();
