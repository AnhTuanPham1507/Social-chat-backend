import { GlobalExceptionFilter } from '@social-chat/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { ClsService } from 'nestjs-cls';

async function bootstrap() {
    initializeTransactionalContext();

    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
        .setTitle('Social chat APIs')
        .setDescription('Tài liệu API của website social chat')
        .setVersion('0.0.1')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/documentation', app, document);

    await app.startAllMicroservices();
    await app.listen(process.env.APP_PORT || 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
