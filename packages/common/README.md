# @social-chat/common

Common utilities, configurations, decorators, guards, and shared functionality for the Social Chat application.

## Overview

This package provides shared infrastructure components that are used across all applications in the monorepo.

## Contents

### Configurations
- **App Configuration**: Application-level settings
- **Database Configuration**: Database connection settings
- **JWT Configuration**: JWT authentication settings
- **Keycloak Configuration**: Keycloak integration settings
- **MinIO Configuration**: Object storage settings
- **Redis Configuration**: Cache storage settings

### Constants
- Application-wide constants
- Error codes and messages

### Decorators
- `@ClientId()`: Extract client ID from request
- `@PublicRoute()`: Mark routes as public (bypass authentication)

### DTOs
- `BaseResponseDto`: Standard response wrapper

### Guards
- `JwtGuard`: JWT authentication guard

### Filters
- `GlobalFilter`: Global exception filter

### Interceptors
- `TransformResponseInterceptor`: Transform responses to standard format

### Utils
- Environment helpers
- Hashing utilities
- Stack trace formatting

## Installation

This package is part of the monorepo and will be automatically linked when you run:

```bash
yarn install
```

## Usage

Import from the package in your application:

```typescript
import { JwtGuard, PublicRoute, BaseResponseDto } from '@social-chat/common';
```

## Building

```bash
yarn workspace @social-chat/common build
```

## Type Checking

```bash
yarn workspace @social-chat/common typecheck
```









