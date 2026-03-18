# @social-chat/infrastructure

Infrastructure layer providing database access, caching, external service integration, and file storage for the Social Chat application.

## Overview

This package implements the infrastructure layer following Hexagonal Architecture principles. It provides concrete implementations for data persistence, caching, external API communication, and file storage.

## Contents

### Database
- **DatabaseModule**: TypeORM configuration and setup
- **Models**: TypeORM entity models (Asset, User, Base)
- **Repositories**: Data access repositories
- **SnakeNamingStrategy**: Database column naming convention

### Cache Storage (Redis)
- **RedisModule**: Redis configuration and client setup
- **RedisBaseService**: Base Redis operations
- **RedisKeyHelper**: Key naming utilities

### External Services
- **HttpService**: HTTP client with retry logic
- **BaseApiClient**: Base class for external API clients
- **KeycloakApiClient**: Keycloak API integration
- **Circuit Breaker**: Fault tolerance pattern
- **Rate Limiter**: Request rate limiting

### File Storage (MinIO)
- **MinioModule**: MinIO client setup
- **MinioService**: File upload/download operations
- **MinioClient**: MinIO client configuration

### Logging
- **LogModule**: Logging configuration

## Dependencies

This package depends on:
- `@social-chat/common`: Shared configurations and utilities
- `@social-chat/domain`: Domain entities and value objects

## Installation

This package is part of the monorepo and will be automatically linked when you run:

```bash
yarn install
```

## Usage

### DatabaseModule

The DatabaseModule uses a factory pattern for configuration injection, giving each app full control over how to load and provide database configuration:

```typescript
import { DatabaseModule } from '@social-chat/infrastructure';
import { DATABASE_CONFIG, IDatabaseConfig } from '@social-chat/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
    }),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get<IDatabaseConfig>(DATABASE_CONFIG);
      },
    }),
  ],
})
export class AppModule {}
```

This pattern allows:
- Each app to load configuration from different sources (ConfigService, environment, custom providers)
- Different apps to use different database configurations
- Full control over configuration validation and transformation at the app level

### ExternalServiceModule

The ExternalServiceModule uses a factory pattern for injecting external service configurations (Keycloak, etc.):

```typescript
import { ExternalServiceModule } from '@social-chat/infrastructure';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG, IKeycloakConfig } from '@social-chat/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ExternalServiceModule.forRootAsync({
      keycloakConfig: {
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return configService.get<IKeycloakConfig>(SOCIAL_CHAT_KEYCLOAK_CONFIG);
        },
      },
    }),
  ],
})
export class AppModule {}
```

This pattern provides:
- App-level control over Keycloak configuration loading
- Clean separation between infrastructure and configuration concerns
- Easy testing with custom configuration providers

### MinioModule

The MinioModule uses a factory pattern for configuration injection:

```typescript
import { MinioModule } from '@social-chat/infrastructure';
import { MINIO_CONFIG, IMinioConfig } from '@social-chat/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MinioModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get<IMinioConfig>(MINIO_CONFIG);
      },
    }),
  ],
})
export class AppModule {}
```

This pattern allows:
- Each app to load MinIO configuration from different sources
- Different apps to use different MinIO instances
- Full control over configuration validation and transformation at the app level

### Other Modules

```typescript
import { 
  RedisModule, 
  MinioService,
  BaseUserRepository 
} from '@social-chat/infrastructure';
```

## Building

```bash
yarn workspace @social-chat/infrastructure build
```

## Type Checking

```bash
yarn workspace @social-chat/infrastructure typecheck
```

## Configuration

This package requires the following environment variables:

### Database
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

### Redis
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

### MinIO
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

### Keycloak
- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_AUTH_CALLBACK_URI`

