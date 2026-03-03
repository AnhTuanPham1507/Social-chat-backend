# @social-chat/domain

Domain entities, value objects, and business logic for the Social Chat application.

## Overview

This package contains the core business domain models, entities, and value objects. It follows Domain-Driven Design (DDD) principles and is framework-agnostic.

## Contents

### Asset Domain
- **Asset Entity**: Core asset entity with business logic
- **AssetSize Value Object**: File size validation and handling
- **AssetType Value Object**: Asset type classification
- **MimeType Value Object**: MIME type validation
- **MaxExceedSizeException**: Domain exception for file size limits

### User Domain
- **User Entity**: Core user entity with business logic
- **UserAvatar Value Object**: User avatar URL validation
- **UserPhone Value Object**: Phone number validation
- **UserSex Value Object**: User sex/gender enumeration

### Common Value Objects
- **Email Value Object**: Email validation
- **Phone Value Object**: Phone number validation
- **URL Value Object**: URL validation

### Error Codes
- Domain-specific error codes

## Design Principles

This package follows:
- **Domain-Driven Design (DDD)**: Entities and value objects represent business concepts
- **Framework Independence**: No external framework dependencies
- **Rich Domain Models**: Business logic lives in entities and value objects
- **Immutability**: Value objects are immutable

## Installation

This package is part of the monorepo and will be automatically linked when you run:

```bash
yarn install
```

## Usage

Import from the package in your application:

```typescript
import { User, Email, Asset, AssetType } from '@social-chat/domain';
```

## Building

```bash
yarn workspace @social-chat/domain build
```

## Type Checking

```bash
yarn workspace @social-chat/domain typecheck
```









