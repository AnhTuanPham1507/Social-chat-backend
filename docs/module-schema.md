# Module Schema for Social Chat Backend

This document provides a template for building new microservice modules following the established patterns in this monorepo.

---

## 1. Architecture Overview

The project follows **Hexagonal Architecture (Ports & Adapters)**:

```
┌─────────────────────────────────────────────────────────────┐
│  DRIVING ADAPTERS (driving-adapters/)                       │
│  - Controllers (HTTP endpoints)                             │
│  - DTOs (Request/Response validation)                       │
│  - Mappers (App Model → HTTP DTO)                           │
│  - Strategies (Authentication)                              │
│  - Middlewares (Request interceptors)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  APPLICATION LAYER (application/)                           │
│  - Application Services (Business logic / Use Cases)        │
│  - Contracts (Interfaces for dependencies)                  │
│  - DTOs (Internal data structures)                          │
│  - Mappers (Entity ↔ App Model)                             │
│  - Exceptions (Domain-specific errors)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  DRIVEN ADAPTERS (driven-adapters/)                         │
│  - Repos (Database repository implementations)              │
│  - Services (External service adapters)                     │
│  - Mappers (Entity ↔ Database Model)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure Template

```
apps/{module-name}/
├── src/
│   ├── main.ts                              # Bootstrap entry point
│   ├── app.module.ts                        # Root module
│   ├── {module}.module.ts                   # Feature module
│   │
│   ├── types/                               # Type augmentations
│   │   └── express.d.ts
│   │
│   ├── application/                         # Business Logic Layer
│   │   ├── application-services/
│   │   │   ├── {feature}.application-service.ts
│   │   │   └── {feature}.application-service.spec.ts
│   │   ├── contracts/
│   │   │   ├── {entity}-repository.contract.ts
│   │   │   └── {external-service}.contract.ts
│   │   ├── dtos/
│   │   │   ├── {feature}.dto.ts
│   │   │   └── {entity}.dto.ts
│   │   ├── mappers/
│   │   │   └── {entity}-app.mapper.ts
│   │   └── exceptions/
│   │       └── {entity}.exception.ts
│   │
│   ├── driven-adapters/                     # Infrastructure Layer
│   │   ├── repos/
│   │   │   ├── {entity}-repository.adapter.ts
│   │   │   └── mappers/
│   │   │       └── {entity}-persistence.mapper.ts
│   │   └── services/
│   │       └── {external-service}.adapter.ts
│   │
│   └── driving-adapters/                    # HTTP Interface Layer
│       ├── controllers/
│       │   └── {feature}.controller.ts
│       ├── dtos/
│       │   ├── {feature}.dto.ts
│       │   └── {entity}.dto.ts
│       ├── mappers/
│       │   └── {entity}.mapper.ts
│       ├── strategies/
│       │   └── {auth-strategy}.strategy.ts
│       ├── middlewares/
│       │   └── {middleware-name}.middleware.ts
│       └── constants/
│           └── endpoint.constant.ts
│
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 3. Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Controller** | `{Feature}Controller` | `AuthController`, `UserController` |
| **Application Service** | `{Feature}ApplicationService` | `AuthApplicationService` |
| **Interface** | `I{Name}` | `IAuthApplicationService`, `IUserRepository` |
| **DI Token** | `{NAME}_TOKEN` (Symbol) | `AUTH_APPLICATION_SERVICE_TOKEN` |
| **Repository Adapter** | `{Entity}Repo` | `UserRepo` |
| **Service Adapter** | `{Service}Adapter` | `IAMServiceAdapter` |
| **Mapper** | `{Entity}{Layer}Mapper` | `UserAppMapper`, `UserPersistenceMapper` |
| **DTO (HTTP)** | `{Action}PayloadDTO`, `{Entity}DTO` | `LoginPayloadDTO`, `UserDTO` |
| **DTO (App)** | Interface with descriptive name | `AuthTokens`, `ExchangeTokenInput` |
| **Exception** | `{Entity}{Error}Exception` | `UserNotFoundException` |
| **Middleware** | `{Feature}Middleware` | `RefreshTokenMiddleware` |
| **Strategy** | `{Type}Strategy` | `JwtStrategy` |
| **Constant** | `UPPER_SNAKE_CASE` | `ENDPOINT`, `USER_REPO_TOKEN` |

---

## 4. File Templates

### 4.1 Application Service

```typescript
// File: application/application-services/{feature}.application-service.ts

import { Injectable, Inject } from '@nestjs/common';

// Token for DI
export const {FEATURE}_APPLICATION_SERVICE_TOKEN = '{FEATURE}_APPLICATION_SERVICE_TOKEN';

// Contract interface
export interface I{Feature}ApplicationService {
  methodName(input: InputType): Promise<OutputType>;
}

@Injectable()
export class {Feature}ApplicationService implements I{Feature}ApplicationService {
  constructor(
    @Inject({ENTITY}_REPO_TOKEN)
    private readonly _{entity}Repo: I{Entity}Repository,

    @Inject({EXTERNAL_SERVICE}_TOKEN)
    private readonly _{externalService}: I{ExternalService},
  ) {}

  public async methodName(input: InputType): Promise<OutputType> {
    // Business logic here
    // 1. Validate/transform input
    // 2. Call dependencies (repos, services)
    // 3. Apply business rules
    // 4. Return result
  }

  private _helperMethod(): void {
    // Private methods prefixed with underscore
  }
}
```

### 4.2 Repository Contract

```typescript
// File: application/contracts/{entity}-repository.contract.ts

import { {Entity}Entity } from '@social-chat/domain';

export const {ENTITY}_REPO_TOKEN = Symbol('{ENTITY}_REPO_TOKEN');

export interface I{Entity}Repository {
  insert(entity: {Entity}Entity): Promise<void>;
  findById(id: string): Promise<{Entity}Entity | null>;
  findByEmail(email: string): Promise<{Entity}Entity | null>;
  update(entity: {Entity}Entity): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 4.3 Repository Adapter

```typescript
// File: driven-adapters/repos/{entity}-repository.adapter.ts

import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Base{Entity}Repository } from '@social-chat/infrastructure';
import { REDIS_SERVICE_TOKEN, RedisBaseService } from '@social-chat/infrastructure';
import { {Entity}Entity } from '@social-chat/domain';
import { I{Entity}Repository } from '@application/contracts/{entity}-repository.contract';
import { {Entity}PersistenceMapper } from './mappers/{entity}-persistence.mapper';

@Injectable()
export class {Entity}Repo implements I{Entity}Repository {
  constructor(
    private _{entity}Repo: Base{Entity}Repository,
    @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
    private readonly _redisService: RedisBaseService,
  ) {}

  public async insert(entity: {Entity}Entity): Promise<void> {
    const model = {Entity}PersistenceMapper.fromEntityToModel(entity);
    const created = await this._{entity}Repo.create(model);

    if (!created) {
      throw new InternalServerErrorException("Can't create {entity}");
    }

    // Cache to Redis
    const cacheKey = SharedStoreKeyHelper.get{Entity}Key(created.id);
    await this._redisService.hset(cacheKey, created);
  }

  public async findById(id: string): Promise<{Entity}Entity | null> {
    // Check cache first
    const cacheKey = SharedStoreKeyHelper.get{Entity}Key(id);
    const cached = await this._redisService.hgetall(cacheKey);

    if (cached) {
      return {Entity}PersistenceMapper.fromModelToEntity(cached as {Entity}Model);
    }

    // Fallback to database
    const model = await this._{entity}Repo.findOne({ id });
    return model ? {Entity}PersistenceMapper.fromModelToEntity(model) : null;
  }
}
```

### 4.4 Persistence Mapper

```typescript
// File: driven-adapters/repos/mappers/{entity}-persistence.mapper.ts

import { {Entity}Model } from '@social-chat/infrastructure';
import { {Entity}Entity, Email, {ValueObject} } from '@social-chat/domain';

export class {Entity}PersistenceMapper {
  static fromEntityToModel(entity: {Entity}Entity): Partial<{Entity}Model> {
    return {
      id: entity.id.value,
      email: entity.email.value,
      // Unwrap all value objects to primitives
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromModelToEntity(model: {Entity}Model): {Entity}Entity {
    return new {Entity}Entity({
      id: model.id,
      props: {
        email: Email.fromString(model.email),
        // Wrap primitives in value objects
      },
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    });
  }
}
```

### 4.5 Controller

```typescript
// File: driving-adapters/controllers/{feature}.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ENDPOINT } from '@driving-adapters/constants/endpoint.constant';
import {
  {FEATURE}_APPLICATION_SERVICE_TOKEN,
  I{Feature}ApplicationService
} from '@application/application-services/{feature}.application-service';
import { CreatePayloadDTO, ResponseDTO } from '@driving-adapters/dtos/{feature}.dto';
import { {Entity}Mapper } from '@driving-adapters/mappers/{entity}.mapper';

@Controller(ENDPOINT.{FEATURE}.BASE)
@ApiTags('{Feature}')
export class {Feature}Controller {
  constructor(
    @Inject({FEATURE}_APPLICATION_SERVICE_TOKEN)
    private readonly _{feature}Service: I{Feature}ApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new {entity}' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  public async create(@Body() payload: CreatePayloadDTO): Promise<ResponseDTO> {
    const result = await this._{feature}Service.create(payload);
    return {Entity}Mapper.fromAppModelToDTO(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get {entity} by ID' })
  public async getById(@Param('id') id: string): Promise<ResponseDTO> {
    const result = await this._{feature}Service.findById(id);
    return {Entity}Mapper.fromAppModelToDTO(result);
  }
}
```

### 4.6 HTTP DTO

```typescript
// File: driving-adapters/dtos/{feature}.dto.ts

import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  IsStrongPassword,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';

export class CreatePayloadDTO {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  }, { message: 'Password must contain at least 8 characters with uppercase, lowercase and symbol' })
  @ApiProperty({ example: 'SecurePass1!', description: 'User password' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name' })
  fullName?: string;
}

export class {Entity}DTO {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  fullName: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
```

### 4.7 HTTP Mapper

```typescript
// File: driving-adapters/mappers/{entity}.mapper.ts

import { {Entity}DTO } from '@driving-adapters/dtos/{entity}.dto';
import { {Entity} } from '@application/dtos/{entity}.dto';

export class {Entity}Mapper {
  static fromAppModelToDTO(model: {Entity}): {Entity}DTO {
    const dto = new {Entity}DTO();
    dto.id = model.id;
    dto.email = model.email;
    dto.fullName = model.fullName;
    dto.createdAt = model.createdAt;
    return dto;
  }

  static fromDTOToAppModel(dto: {Entity}DTO): {Entity} {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName,
      createdAt: dto.createdAt,
    };
  }
}
```

### 4.8 Application DTO (Interface)

```typescript
// File: application/dtos/{entity}.dto.ts

export interface {Entity} {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create{Entity}Input {
  email: string;
  password: string;
  fullName?: string;
}

export interface Update{Entity}Input {
  id: string;
  fullName?: string;
  // ... other updateable fields
}
```

### 4.9 Application Mapper

```typescript
// File: application/mappers/{entity}-app.mapper.ts

import { {Entity}Entity } from '@social-chat/domain';
import { {Entity}, Create{Entity}Input } from '@application/dtos/{entity}.dto';
import { v4 as uuidv4 } from 'uuid';
import { Email } from '@social-chat/domain';

export class {Entity}AppMapper {
  static fromInputToEntity(input: Create{Entity}Input): {Entity}Entity {
    return new {Entity}Entity({
      id: uuidv4(),
      props: {
        email: Email.fromString(input.email),
        fullName: input.fullName,
        // ... map other fields
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromEntityToAppModel(entity: {Entity}Entity): {Entity} {
    return {
      id: entity.id.value,
      email: entity.email.value,
      fullName: entity.fullName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
```

### 4.10 Exception

```typescript
// File: application/exceptions/{entity}.exception.ts

import { DomainException } from '@social-chat/common';

export class {Entity}NotFoundException extends DomainException {
  constructor(message?: string, cause?: Error) {
    super('{ENTITY}_NOT_FOUND', message ?? '{Entity} not found', cause);
  }
}

export class {Entity}AlreadyExistsException extends DomainException {
  constructor(message?: string, cause?: Error) {
    super('{ENTITY}_ALREADY_EXISTS', message ?? '{Entity} already exists', cause);
  }
}

export class Invalid{Entity}Exception extends DomainException {
  constructor(message?: string, cause?: Error) {
    super('INVALID_{ENTITY}', message ?? 'Invalid {entity} data', cause);
  }
}
```

### 4.11 Endpoint Constants

```typescript
// File: driving-adapters/constants/endpoint.constant.ts

export const ENDPOINT = {
  {FEATURE}: {
    BASE: '{feature}',
    GET_BY_ID: ':id',
    CREATE: '',
    UPDATE: ':id',
    DELETE: ':id',
    LIST: 'list',
    // ... other endpoints
  },
} as const;
```

### 4.12 Feature Module

```typescript
// File: {feature}.module.ts

import { Module } from '@nestjs/common';
import { {Feature}Controller } from '@driving-adapters/controllers/{feature}.controller';
import {
  {FEATURE}_APPLICATION_SERVICE_TOKEN,
  {Feature}ApplicationService
} from '@application/application-services/{feature}.application-service';
import { {ENTITY}_REPO_TOKEN } from '@application/contracts/{entity}-repository.contract';
import { {Entity}Repo } from '@driven-adapters/repos/{entity}-repository.adapter';

@Module({
  imports: [
    // Import required modules
  ],
  controllers: [{Feature}Controller],
  providers: [
    {
      provide: {FEATURE}_APPLICATION_SERVICE_TOKEN,
      useClass: {Feature}ApplicationService,
    },
    {
      provide: {ENTITY}_REPO_TOKEN,
      useClass: {Entity}Repo,
    },
  ],
  exports: [
    {FEATURE}_APPLICATION_SERVICE_TOKEN,
  ],
})
export class {Feature}Module {}
```

### 4.13 App Module

```typescript
// File: app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { configs } from '@social-chat/common';
import { LogModule } from '@social-chat/infrastructure';
import { DatabaseModule } from '@social-chat/infrastructure';
import { RedisModule } from '@social-chat/infrastructure';
import { {Feature}Module } from './{feature}.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: `../../.env`,
      load: [configs],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        saveReq: true,
        generateId: true,
      },
    }),
    LogModule,
    DatabaseModule.forRootAsync({
      useFactory: (configService) => ({
        // Database configuration
      }),
      inject: [ConfigService],
    }),
    RedisModule.registerAsync([
      // Redis configuration
    ]),
    {Feature}Module,
  ],
})
export class AppModule {}
```

### 4.14 Main Bootstrap

```typescript
// File: main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@social-chat/common';
import { LogService } from '@social-chat/infrastructure';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  const logService = app.get(LogService);

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter(logService));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('{Module Name} API')
    .setDescription('API documentation for {Module Name} microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/documentation', app, document);

  // Start
  await app.startAllMicroservices();
  await app.listen(process.env.APP_PORT || 3000);

  logService.log(`Application running on port ${process.env.APP_PORT || 3000}`);
}

bootstrap();
```

### 4.15 tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./src",
    "paths": {
      "@application/*": ["application/*"],
      "@driving-adapters/*": ["driving-adapters/*"],
      "@driven-adapters/*": ["driven-adapters/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.16 nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ],
    "tsConfigPath": "tsconfig.json"
  }
}
```

### 4.17 package.json

```json
{
  "name": "@social-chat/{module-name}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@social-chat/common": "workspace:*",
    "@social-chat/domain": "workspace:*",
    "@social-chat/infrastructure": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cookie-parser": "^1.4.6",
    "nestjs-cls": "^4.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "typeorm-transactional": "^0.5.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/cookie-parser": "^1.4.3",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/uuid": "^9.0.2",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.1.3"
  }
}
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HTTP Request                                    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Controller                                                                  │
│  - Receives HTTP request                                                     │
│  - Validates with DTO (class-validator)                                      │
│  - Calls Application Service                                                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ CreatePayloadDTO
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Application Service                                                         │
│  - Business logic / Use case                                                 │
│  - Uses AppMapper to convert DTO → Entity                                    │
│  - Calls Repository/External Services                                        │
│  - Uses AppMapper to convert Entity → App Model                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ Entity
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Repository Adapter                                                          │
│  - Uses PersistenceMapper to convert Entity → Model                          │
│  - Interacts with Database (TypeORM)                                         │
│  - Caches to Redis                                                           │
│  - Uses PersistenceMapper to convert Model → Entity                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ Model
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mapper Flow:**
```
HTTP DTO ──(no mapper)──► App Service Input
                              │
                              ▼
                       AppMapper.fromInputToEntity()
                              │
                              ▼
                           Entity
                              │
                              ▼
                   PersistenceMapper.fromEntityToModel()
                              │
                              ▼
                        Database Model
                              │
                              ▼
                   PersistenceMapper.fromModelToEntity()
                              │
                              ▼
                           Entity
                              │
                              ▼
                    AppMapper.fromEntityToAppModel()
                              │
                              ▼
                         App Model
                              │
                              ▼
                    HTTPMapper.fromAppModelToDTO()
                              │
                              ▼
                          HTTP DTO
```

---

## 6. Checklist for New Module

- [ ] Create `apps/{module-name}/` directory
- [ ] Create `src/` subdirectory with structure
- [ ] Create `main.ts` bootstrap file
- [ ] Create `app.module.ts` root module
- [ ] Create `{feature}.module.ts` feature module
- [ ] Create `application/` layer
  - [ ] `application-services/{feature}.application-service.ts`
  - [ ] `contracts/{entity}-repository.contract.ts`
  - [ ] `dtos/{entity}.dto.ts`
  - [ ] `mappers/{entity}-app.mapper.ts`
  - [ ] `exceptions/{entity}.exception.ts`
- [ ] Create `driven-adapters/` layer
  - [ ] `repos/{entity}-repository.adapter.ts`
  - [ ] `repos/mappers/{entity}-persistence.mapper.ts`
  - [ ] `services/{external-service}.adapter.ts` (if needed)
- [ ] Create `driving-adapters/` layer
  - [ ] `controllers/{feature}.controller.ts`
  - [ ] `dtos/{feature}.dto.ts`
  - [ ] `mappers/{entity}.mapper.ts`
  - [ ] `constants/endpoint.constant.ts`
  - [ ] `strategies/` (if auth needed)
  - [ ] `middlewares/` (if needed)
- [ ] Create configuration files
  - [ ] `package.json`
  - [ ] `tsconfig.json`
  - [ ] `nest-cli.json`
- [ ] Add domain entities to `packages/domain/`
- [ ] Add database models to `packages/infrastructure/`
- [ ] Add to workspace in root `package.json`
- [ ] Write unit tests for application services

---

## 7. Key Patterns to Follow

1. **Dependency Injection with Symbols**: Always use Symbol tokens for DI to ensure unique identifiers
2. **Interface-based contracts**: Define interfaces in `application/contracts/` for all dependencies
3. **Three-layer mapping**: HTTP DTO ↔ App Model ↔ Entity ↔ Database Model
4. **Cache-aside pattern**: Check Redis before hitting database
5. **Value Objects**: Use domain value objects for type safety (Email, Phone, etc.)
6. **Private method prefix**: Use underscore `_` for private methods
7. **Validation decorators**: Use class-validator for HTTP DTOs
8. **Swagger documentation**: Add @ApiProperty to all DTO fields
9. **Global exception handling**: Use DomainException subclasses
10. **Async/await**: All I/O operations should be async

---

## 8. Shared Packages

| Package | Purpose |
|---------|---------|
| `@social-chat/common` | Shared utilities, configs, exceptions, decorators |
| `@social-chat/domain` | Domain entities, value objects |
| `@social-chat/infrastructure` | Database models, repositories, Redis, external services |
