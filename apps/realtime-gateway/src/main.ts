import { GlobalExceptionFilter } from '@social-chat/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
            validationError: { target: true },
        }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter(app.get(ClsService)));

    const port = process.env.APP_PORT || 3006;
    await app.listen(port);
    console.log(`Realtime gateway is running on: ${await app.getUrl()}`);
}

bootstrap();
