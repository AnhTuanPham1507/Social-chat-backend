import { GlobalExceptionFilter } from '@social-chat/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { initializeTransactionalContext } from 'typeorm-transactional';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
    initializeTransactionalContext();

    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });

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

    app.useGlobalFilters(new GlobalExceptionFilter(app.get(ClsService)));

    const config = new DocumentBuilder()
        .setTitle('Social Chat - Messaging Service')
        .setDescription('Messaging API documentation')
        .setVersion('0.0.1')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/documentation', app, document);

    const port = process.env.APP_PORT || 3005;
    await app.listen(port);
    console.log(`Messaging service is running on: ${await app.getUrl()}`);
}

bootstrap();
