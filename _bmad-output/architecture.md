---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - '_bmad-output/prd.md'
workflowType: 'architecture'
lastStep: 6
project_name: 'sproux-service'
user_name: 'You'
date: '2026-01-14'
status: complete
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The system encompasses 65 functional requirements across 8 major domains:

1. **User Account & Authentication (FR1-FR8)**: OAuth2/OIDC authentication through Keycloak, JWT token validation, RBAC enforcement, profile management, and device token registration for push notifications.

2. **Content Creation & Management (FR9-FR19)**: Post creation with multi-media support (images, videos), audience targeting (public/friends/groups), reactions, comments, sharing, and automatic hashtag extraction.

3. **Social Connections (FR20-FR27)**: Symmetric friend relationships with request/accept flow, unfriend/block capabilities, friend suggestions, and relationship state management.

4. **Content Discovery & Feed (FR28-FR32)**: Personalized home feed with real-time updates, sub-1-second fan-out delivery, pull-to-refresh, and pagination for historical content.

5. **Real-time Messaging (FR33-FR44)**: One-on-one and group conversations, multi-media message support, real-time delivery, read receipts, delivery status, and group member management.

6. **Notifications & Engagement (FR45-FR53)**: In-app and push notifications for social interactions, unread counts, mark-as-read functionality, and intelligent notification aggregation.

7. **Presence & Status (FR54-FR57)**: Online/offline tracking, typing indicators, heartbeat-based presence management, and connection state updates.

8. **AI Chatbot (FR58-FR65)**: Conversational AI with context retention, streaming responses, feed/conversation summarization, content suggestions, and personalized recommendations.

**Non-Functional Requirements:**

Critical NFRs that will drive architectural decisions:

- **Performance**: Feed delivery < 1s, API p95 < 100ms, message delivery < 200ms, search < 200ms
- **Scalability**: 1,000+ concurrent WebSocket connections, 1,000+ msg/sec throughput, horizontal scaling support
- **Reliability**: 99.5% uptime, at-least-once message delivery, zero-downtime deployments
- **Security**: OAuth2/OIDC authentication, JWT validation, RBAC, TLS 1.3, rate limiting (1000 req/min per user)
- **Observability**: Distributed tracing (OpenTelemetry/Jaeger), metrics (Prometheus), logging (ELK), health checks

**Scale & Complexity:**

- **Primary domain**: API Backend / Microservices
- **Complexity level**: Enterprise-grade (despite learning project context)
- **Estimated architectural components**: 8-12 microservices (Auth, User, Post, Feed, Friend, Message, Notification, Presence, Search, Trending, Group, AI Chatbot)
- **Data stores**: 5 different databases (PostgreSQL, MongoDB, Cassandra, Redis, Elasticsearch)
- **API styles**: 4 different protocols (GraphQL, REST, gRPC, WebSocket/SSE)
- **Event infrastructure**: Kafka for event sourcing and inter-service communication

### Technical Constraints & Dependencies

**External Dependencies:**
- **Keycloak**: Identity provider for OAuth2/OIDC flows, JWKS endpoint, token refresh
- **LLM Provider** (OpenAI/Claude): Streaming API for AI chatbot, rate limit handling, timeout management
- **Push Notification Services**: FCM (Android) / APNs (iOS) for mobile push delivery
- **Object Storage**: MinIO (S3-compatible) for media storage with CDN integration

**Technology Stack Constraints:**
- **Backend Framework**: NestJS (TypeScript) - already established in codebase
- **Database Variety**: Must incorporate PostgreSQL, MongoDB, Cassandra, Redis, Elasticsearch to achieve learning objectives
- **Message Queue**: Kafka required for event-driven patterns and fan-out operations
- **Real-time Protocols**: WebSocket and SSE for different real-time use cases

**Development Constraints:**
- **Learning-First Approach**: Architecture must naturally justify technology choices, not force-fit them
- **Phased Implementation**: Must support incremental development (Phase 1-6 roadmap)
- **Production-Ready Standards**: Enterprise patterns (DDD, CQRS, Event Sourcing) must be implemented correctly

### Cross-Cutting Concerns Identified

**1. Authentication & Authorization:**
- OAuth2/OIDC integration across all services
- JWT token validation at API gateway and service boundaries
- RBAC enforcement for protected endpoints
- Scope-based permissions for fine-grained access control

**2. Real-time Event Delivery:**
- WebSocket connection management across multiple instances
- SSE for one-way push notifications
- Redis Pub/Sub for cross-instance WebSocket coordination
- Presence tracking with heartbeat mechanisms

**3. Data Consistency:**
- Multi-database coordination (PostgreSQL, MongoDB, Cassandra)
- Eventual consistency patterns for feed fan-out
- Event sourcing for audit trails and reactions
- CQRS for separating read/write models

**4. Observability & Monitoring:**
- Distributed tracing across all services (OpenTelemetry)
- Centralized logging (ELK Stack)
- Metrics collection and dashboards (Prometheus/Grafana)
- Health checks for Kubernetes orchestration

**5. Performance & Scalability:**
- Caching strategy (Redis) for hot data
- Database read replicas for query scaling
- Horizontal scaling for stateless services
- Rate limiting and throttling protection

**6. Message Delivery Guarantees:**
- At-least-once delivery semantics via Kafka
- Idempotency handling for duplicate events
- Dead letter queues for failed processing
- Retry mechanisms with exponential backoff

**7. API Gateway & Routing:**
- GraphQL gateway for client-facing queries
- gRPC for low-latency service-to-service calls
- REST for webhooks and third-party integrations
- API versioning strategies across different protocols

**8. Media & Asset Management:**
- Object storage integration (MinIO/S3)
- Image resizing and thumbnail generation
- CDN integration for content delivery
- Pre-signed URLs for secure access

## Starter Template Evaluation

### Primary Technology Domain

**API/Backend Microservices** - NestJS monorepo architecture for building scalable social media backend services.

### Starter Approach: Existing Project Foundation

Rather than initializing a new starter template, this architecture builds upon an existing, well-structured NestJS monorepo that already establishes core architectural patterns.

**Rationale for Continuing with Existing Foundation:**
- Monorepo structure already supports microservices architecture
- DDD-style package separation (domain, infrastructure, common) aligns with enterprise patterns
- Authentication service already implemented with Keycloak OAuth2/OIDC
- Foundation is production-ready and follows NestJS best practices

### Current Project Structure

```
social-chat-monorepo/
├── apps/
│   ├── auth/              # Authentication microservice (✅ Exists)
│   └── user/              # User microservice (✅ Exists)
├── packages/
│   ├── common/            # Shared utilities, decorators, guards
│   ├── domain/            # Domain entities, value objects, interfaces
│   └── infrastructure/    # Database, external service adapters
```

### Architectural Decisions Provided by Existing Foundation

**Language & Runtime:**
- TypeScript ^5.1.3 with strict configuration
- Node.js runtime with NestJS ^10.4.1

**Package Management:**
- Yarn Workspaces for monorepo management
- Workspace structure: `apps/*` and `packages/*`

**Build Tooling:**
- NestJS CLI for building individual services
- Workspace-aware build scripts (`yarn build:auth`, `yarn build:user`)

**Testing Framework:**
- Jest ^29.7.0 with ts-jest
- Per-workspace test commands (`yarn test:auth`, `yarn test:domain`)

**Code Quality:**
- ESLint ^8.57.0 with TypeScript parser
- Prettier ^3.0.0 for formatting
- Unused imports plugin for clean code

**Logging:**
- Pino ^10.1.0 with pino-http for structured logging

**Validation:**
- class-validator ^0.14.3 for DTO validation
- class-transformer ^0.5.1 for object transformation

**Database (Current):**
- TypeORM ^0.3.28 with PostgreSQL

### Technologies to Add (Incremental)

The following technologies will be added as features require them:

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| Kafka | Event streaming, fan-out | Feed/Notification services |
| Redis | Caching, Pub/Sub, presence | Presence/Feed services |
| MongoDB | Message storage | Messaging service |
| Elasticsearch | Search functionality | Search service |
| @nestjs/websockets | Real-time communication | Messaging/Presence |
| @nestjs/graphql | API gateway | Phase 6 |
| @nestjs/microservices | gRPC communication | Service-to-service |

### Architecture Review: Clean Architecture & DDD Assessment

**Conducted via Party Mode with: Winston (Architect), Amelia (Developer), Murat (Test Architect)**

#### Current Architecture Score: ~70% Compliant

| Principle | Status | Notes |
|-----------|--------|-------|
| Dependency Rule | ⚠️ Partial | Domain mostly clean, minor coupling exists |
| Entity Richness | ❌ Weak | Entities lack behavior - currently anemic |
| Aggregate Boundaries | ❓ Missing | No clear aggregate roots defined |
| Domain Events | ❌ Missing | No event-driven domain model |
| Repository Pattern | ✅ Good | Clean interface/implementation separation |
| Value Objects | ✅ Good | Proper validation encapsulation |
| Layer Separation | ✅ Good | Clear driving/driven adapter structure |

#### Required Improvements for Production-Grade DDD

**1. Rich Domain Entities (Priority: High)**
- Convert anemic entities to behavior-rich aggregates
- Use factory methods (`create()`, `reconstitute()`) instead of public constructors
- Encapsulate business rules within entity methods
- Remove `any` types from constructors

**2. Aggregate Root Pattern (Priority: High)**
- Create `AggregateRoot` base class extending `Entity`
- Define clear aggregate boundaries (e.g., `User` as root for profile data)
- Aggregates collect domain events internally

**3. Domain Events (Priority: High)**
- Create `DomainEvent` base class
- Entities emit events on state changes (`UserCreatedEvent`, `EmailChangedEvent`)
- Application services publish events after persistence
- Enables Kafka integration for event-driven architecture

**4. Infrastructure Decoupling (Priority: Medium)**
- Duplicate enums in infrastructure layer instead of importing from domain
- Use mappers to translate between domain and persistence representations
- Keep TypeORM decorators out of domain entities

**5. Application Service Responsibility (Priority: Medium)**
- Application services should only orchestrate, not contain business logic
- Business rules belong in domain entities
- Services coordinate: load aggregate → call domain method → persist → publish events

#### Target Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER (packages/domain)                │
│  • Aggregate Roots with behavior methods                        │
│  • Value Objects with validation                                │
│  • Domain Events                                                │
│  • Domain Exceptions                                            │
│  • NO framework dependencies                                    │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ depends on (interfaces only)
┌─────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (apps/*/src/application)          │
│  • Application Services (orchestration)                         │
│  • Port Interfaces (IUserRepository, IEventPublisher)           │
│  • Use Case DTOs                                                │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
┌─────────────────────────────────────────────────────────────────┐
│            INFRASTRUCTURE (packages/infrastructure)              │
│  • Repository Implementations                                   │
│  • Database Models (separate from domain entities)              │
│  • External Service Adapters                                    │
│  • Event Publisher (Kafka)                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Priority for DDD Improvements

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Create `AggregateRoot` base class | Foundation for all improvements |
| 2 | Refactor `UserEntity` with rich behavior | Template for other entities |
| 3 | Implement `DomainEvent` system | Required for Kafka integration |
| 4 | Add `IEventPublisher` port and Kafka adapter | Event-driven architecture |
| 5 | Decouple infrastructure enums | Clean dependency rule |

**Note:** These DDD improvements should be implemented as part of the first stories in Phase 1, before adding new features.

## Core Architectural Decisions

### Decision Priority Summary

**Critical Decisions (Made):**
- Database strategy and service architecture
- API protocol assignments
- Authorization pattern
- Security measures

**Deferred Decisions (To Implementation Phase):**
- Caching TTLs and invalidation strategies
- Kafka topic structure and event schemas

### Category 1: Data Architecture

#### 1.1 Database Strategy (Hybrid Approach)

**Decision:** Start with PostgreSQL + Redis, design for future migration to MongoDB/Cassandra

**Phase 1-2 (MVP):**
| Data | Database |
|------|----------|
| Users, Posts, Friends, Feed, Messages, Notifications | PostgreSQL |
| Cache, Sessions, Presence | Redis |
| Search (Users, Posts, Hashtags) | Elasticsearch |

**Phase 3+ (Scale & Learn):**
| Data | Migration Target |
|------|------------------|
| Messages | MongoDB (flexible schema, message history) |
| Feed (optional) | MongoDB or Cassandra |

**Rationale:**
- Ship faster with fewer databases initially
- Learn migration patterns as a real-world skill
- Repository pattern enables storage layer swapping

**Implementation Pattern:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HYBRID DATABASE STRATEGY                            │
├─────────────────────────────────────────────────────────────────────────┤
│  PHASE 1-2:                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Users, Posts, Friends, Feed, Messages  →  PostgreSQL           │   │
│  │  Cache, Sessions, Presence              →  Redis                │   │
│  │  Search                                 →  Elasticsearch        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  PHASE 3+:                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Messages  →  Migrate to MongoDB                                │   │
│  │  Feed      →  Optionally migrate to MongoDB/Cassandra           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1.2 Caching Strategy

**Decision:** Deferred to implementation phase

**Guideline:** Redis is the caching technology. Specific TTLs and invalidation strategies will be defined per feature during implementation to match actual access patterns.

### Category 2: API & Communication Patterns

#### 2.1 Protocol Assignment

**Decision:** REST + WebSocket + gRPC for Phase 1-2, GraphQL deferred to Phase 6

| Protocol | Use Case |
|----------|----------|
| **REST** | External client API (auth, CRUD operations, webhooks) |
| **WebSocket** | Real-time (messaging, typing, presence, live feed, notifications) |
| **gRPC** | Internal service-to-service communication |
| **GraphQL** | Client-facing API gateway (Phase 6) |

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                      API PROTOCOL ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│   Mobile/Web Clients                                                    │
│         │                                                               │
│         ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    REST API (External)                          │  │
│   │  • Auth callbacks, CRUD operations, Webhooks                    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│         │                                                               │
│         ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                  WebSocket (Real-time)                          │  │
│   │  • Messaging, Typing, Presence, Live feed, Notifications        │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│   │                  Internal Service Mesh (gRPC)                   │  │
│   │  Auth ◄──► User ◄──► Post ◄──► Message ◄──► Notification       │  │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Event Bus (Kafka)

**Decision:** Deferred to implementation phase

**Guideline:** Kafka is the event streaming technology. Topic naming conventions and event schemas will be defined per feature during implementation.

### Category 3: Authentication & Security

#### 3.1 Authorization Pattern

**Decision:** Hybrid (Keycloak + Application)

| Layer | Responsibility |
|-------|---------------|
| **Keycloak** | Identity roles (user, admin, moderator) |
| **Application** | Resource-level permissions (post owner, group admin, conversation participant) |

**Implementation:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HYBRID AUTHORIZATION                                │
├─────────────────────────────────────────────────────────────────────────┤
│   Keycloak (Identity Roles)          Application (Resource Permissions) │
│   ┌─────────────────────┐            ┌─────────────────────────────┐   │
│   │ • user              │            │ • isPostOwner(userId, post) │   │
│   │ • admin             │            │ • isGroupAdmin(userId, grp) │   │
│   │ • moderator         │            │ • canViewPost(userId, post) │   │
│   └─────────────────────┘            │ • isConversationMember()    │   │
│                                      └─────────────────────────────┘   │
│                                                                         │
│   NestJS Guards: @Roles('admin')  +  @ResourceGuard(PostOwnerGuard)    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 API Security Measures

**Decision:** Standard security stack

| Measure | Implementation |
|---------|---------------|
| Rate Limiting | 1000 req/min per user |
| JWT Validation | JWKS from Keycloak |
| Input Validation | class-validator on all DTOs |
| SQL Injection Prevention | TypeORM parameterized queries |
| XSS Prevention | Sanitize user content on output |

### Category 4: Infrastructure & Deployment

#### 4.1 Service Architecture

**Decision:** 5 consolidated microservices (from original 8)

| Service | Responsibilities | Database |
|---------|-----------------|----------|
| **auth** | OAuth, tokens, sessions | PostgreSQL + Redis |
| **user** | Profiles, friends, blocks, requests | PostgreSQL + Redis |
| **post** | Posts, reactions, comments, feed, hashtags | PostgreSQL + Redis + Elasticsearch |
| **message** | Conversations, messages, presence, typing, WebSocket | PostgreSQL → MongoDB (Phase 3) + Redis |
| **notification** | In-app, push, unread counts, aggregation | PostgreSQL + Redis |

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATED SERVICE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│   │    AUTH     │  │    USER     │  │    POST     │                    │
│   │ • OAuth     │  │ • Profiles  │  │ • Posts     │                    │
│   │ • Tokens    │  │ • Friends   │  │ • Reactions │                    │
│   │ • Sessions  │  │ • Blocks    │  │ • Comments  │                    │
│   └─────────────┘  └─────────────┘  │ • Feed      │                    │
│         │                │          └─────────────┘                    │
│         └────────────────┼────────────────┘                             │
│                          │ gRPC                                         │
│         ┌────────────────┼────────────────┐                             │
│   ┌─────────────┐  ┌─────────────┐                                     │
│   │   MESSAGE   │  │ NOTIFICATION│                                     │
│   │ • Chats     │  │ • In-app    │                                     │
│   │ • Messages  │  │ • Push      │                                     │
│   │ • Presence  │  │ • Unread    │                                     │
│   │ • WebSocket │  │             │                                     │
│   └─────────────┘  └─────────────┘                                     │
│                                                                         │
│   TOTAL: 5 Services                                                     │
│   ├── auth          (existing)                                          │
│   ├── user          (existing, expanded)                                │
│   ├── post          (new)                                               │
│   ├── message       (new)                                               │
│   └── notification  (new)                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.2 Deployment Strategy

**Decision:** Docker Compose for local development, Kubernetes deferred

| Environment | Strategy |
|-------------|----------|
| Local Development | Docker Compose (all infrastructure) |
| CI/CD | GitHub Actions |
| Production | Kubernetes (deferred to later phase) |

**Local Infrastructure (docker-compose.yml updated):**

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache, sessions, presence |
| Elasticsearch | 9200 | Search |
| Kafka | 29092 | Event streaming |
| MinIO | 9000/9001 | Object storage |
| Keycloak | 8080 | Identity provider |

### Decision Impact Analysis

**Implementation Sequence:**
1. DDD improvements (AggregateRoot, Domain Events)
2. Service scaffolding (post, message, notification apps)
3. gRPC setup for service-to-service communication
4. WebSocket infrastructure for real-time features
5. Elasticsearch integration for search
6. Kafka integration for event streaming

**Cross-Component Dependencies:**
- All services depend on auth service for JWT validation
- Feed generation depends on post and friend services
- Notifications depend on all services for event triggers
- Presence is shared between message and user services

## Implementation Patterns & Consistency Rules

_This section defines strict patterns that AI agents MUST follow when implementing features. These patterns ensure consistency across all services and prevent architectural drift._

### Directory Structure Pattern

**Every microservice follows this exact structure:**

```
apps/{service-name}/
├── src/
│   ├── main.ts                           # Bootstrap
│   ├── {service}.module.ts               # Root module
│   ├── application/
│   │   ├── commands/                     # Write operations (CQRS)
│   │   │   ├── {action}-{entity}/
│   │   │   │   ├── {action}-{entity}.command.ts
│   │   │   │   └── {action}-{entity}.handler.ts
│   │   ├── queries/                      # Read operations (CQRS)
│   │   │   ├── {query-name}/
│   │   │   │   ├── {query-name}.query.ts
│   │   │   │   └── {query-name}.handler.ts
│   │   ├── services/                     # Application services (orchestration only)
│   │   │   └── {entity}.application-service.ts
│   │   └── ports/                        # Interfaces for driven adapters
│   │       ├── {entity}.repository.port.ts
│   │       └── {external}.client.port.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── {entity}/
│   │   │       ├── {entity}.entity.ts    # Aggregate root
│   │   │       └── {value-object}.vo.ts  # Value objects
│   │   ├── events/
│   │   │   └── {entity}-{action}.event.ts
│   │   └── exceptions/
│   │       └── {entity}-{error}.exception.ts
│   └── infrastructure/
│       ├── controllers/                  # REST/gRPC endpoints
│       │   └── {entity}.controller.ts
│       ├── gateways/                     # WebSocket gateways
│       │   └── {feature}.gateway.ts
│       ├── repositories/                 # Database implementations
│       │   └── {entity}.repository.ts
│       ├── models/                       # TypeORM/Mongoose models
│       │   └── {entity}.model.ts
│       ├── mappers/                      # Entity ↔ Model conversion
│       │   └── {entity}.mapper.ts
│       └── clients/                      # External service clients
│           └── {service}.client.ts
└── test/
    ├── unit/
    │   ├── domain/
    │   └── application/
    ├── integration/
    │   └── repositories/
    └── e2e/
        └── {entity}.e2e-spec.ts
```

### Naming Conventions

**Files:**
| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{entity}.entity.ts` | `user.entity.ts` |
| Value Object | `{name}.vo.ts` | `email.vo.ts` |
| Domain Event | `{entity}-{action}.event.ts` | `user-created.event.ts` |
| Repository Port | `{entity}.repository.port.ts` | `user.repository.port.ts` |
| Repository Impl | `{entity}.repository.ts` | `user.repository.ts` |
| Controller | `{entity}.controller.ts` | `user.controller.ts` |
| Command | `{action}-{entity}.command.ts` | `create-user.command.ts` |
| Query | `{query-name}.query.ts` | `get-user-by-id.query.ts` |
| DTO | `{entity}.dto.ts` | `user.dto.ts` |
| Model (DB) | `{entity}.model.ts` | `user.model.ts` |
| Mapper | `{entity}.mapper.ts` | `user.mapper.ts` |

**Classes:**
| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{Entity}Entity` | `UserEntity` |
| Value Object | `{Name}VO` or `{Name}ValueObject` | `EmailVO` |
| Domain Event | `{Entity}{Action}Event` | `UserCreatedEvent` |
| Repository Port | `I{Entity}Repository` | `IUserRepository` |
| Repository Impl | `{Entity}RepositoryImpl` | `UserRepositoryImpl` |
| Application Service | `{Entity}ApplicationService` | `UserApplicationService` |
| Command | `{Action}{Entity}Command` | `CreateUserCommand` |
| Command Handler | `{Action}{Entity}Handler` | `CreateUserHandler` |
| Controller | `{Entity}Controller` | `UserController` |
| DTO | `{Action}{Entity}Dto` | `CreateUserDto` |

### Domain Layer Patterns

#### Aggregate Root Template

```typescript
// packages/domain/src/core/aggregate-root.ts
import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
```

#### Entity Pattern (Rich Domain Model)

```typescript
// apps/user/src/domain/entities/user/user.entity.ts
import { AggregateRoot } from '@packages/domain';
import { UserCreatedEvent } from '../../events/user-created.event';
import { EmailVO } from './email.vo';

interface UserProps {
  email: EmailVO;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity extends AggregateRoot<UserProps> {
  // Private constructor - use factory methods
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // Factory method for new entities
  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): UserEntity {
    const now = new Date();
    const user = new UserEntity({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
    user.addDomainEvent(new UserCreatedEvent(user.id, props.email.value));
    return user;
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: UserProps, id: string): UserEntity {
    return new UserEntity(props, id);
  }

  // Getters - expose read-only access
  get email(): EmailVO {
    return this.props.email;
  }
  get displayName(): string {
    return this.props.displayName;
  }
  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  // Business methods with behavior
  updateDisplayName(name: string): void {
    if (name.length < 2 || name.length > 50) {
      throw new InvalidDisplayNameException(name);
    }
    this.props.displayName = name;
    this.props.updatedAt = new Date();
  }

  updateAvatar(url: string): void {
    this.props.avatarUrl = url;
    this.props.updatedAt = new Date();
  }
}
```

#### Value Object Pattern

```typescript
// packages/domain/src/value-objects/email.vo.ts
import { ValueObject } from '../core/value-object';

interface EmailProps {
  value: string;
}

export class EmailVO extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): EmailVO {
    if (!EmailVO.isValid(email)) {
      throw new InvalidEmailException(email);
    }
    return new EmailVO({ value: email.toLowerCase().trim() });
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this.props.value;
  }
}
```

#### Domain Event Pattern

```typescript
// packages/domain/src/core/domain-event.ts
export abstract class DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract get eventName(): string;
}

// apps/user/src/domain/events/user-created.event.ts
export class UserCreatedEvent extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'user.created';
  }
}
```

### Application Layer Patterns

#### Repository Port (Interface)

```typescript
// apps/user/src/application/ports/user.repository.port.ts
import { UserEntity } from '../../domain/entities/user/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

// Token for dependency injection
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

#### Command Handler Pattern (CQRS Write)

```typescript
// apps/user/src/application/commands/create-user/create-user.command.ts
export class CreateUserCommand {
  constructor(
    readonly email: string,
    readonly displayName: string,
    readonly keycloakId: string,
  ) {}
}

// apps/user/src/application/commands/create-user/create-user.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { IUserRepository, USER_REPOSITORY } from '../../ports/user.repository.port';
import { IEventPublisher, EVENT_PUBLISHER } from '../../ports/event-publisher.port';
import { UserEntity } from '../../../domain/entities/user/user.entity';
import { EmailVO } from '../../../domain/entities/user/email.vo';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    // 1. Create domain entity (business logic inside entity)
    const user = UserEntity.create({
      email: EmailVO.create(command.email),
      displayName: command.displayName,
      avatarUrl: null,
    });

    // 2. Persist
    await this.userRepo.save(user);

    // 3. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearEvents();

    // 4. Return result
    return user.id;
  }
}
```

#### Query Handler Pattern (CQRS Read)

```typescript
// apps/user/src/application/queries/get-user-by-id/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(readonly userId: string) {}
}

// apps/user/src/application/queries/get-user-by-id/get-user-by-id.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserResponseDto | null> {
    const user = await this.userRepo.findById(query.userId);
    if (!user) return null;
    return UserResponseDto.fromEntity(user);
  }
}
```

### Infrastructure Layer Patterns

#### TypeORM Model (Separate from Domain Entity)

```typescript
// apps/user/src/infrastructure/models/user.model.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserModel {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'keycloak_id', unique: true })
  keycloakId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Mapper Pattern (Entity ↔ Model)

```typescript
// apps/user/src/infrastructure/mappers/user.mapper.ts
import { UserEntity } from '../../domain/entities/user/user.entity';
import { UserModel } from '../models/user.model';
import { EmailVO } from '../../domain/entities/user/email.vo';

export class UserMapper {
  static toDomain(model: UserModel): UserEntity {
    return UserEntity.reconstitute(
      {
        email: EmailVO.create(model.email),
        displayName: model.displayName,
        avatarUrl: model.avatarUrl,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
      model.id,
    );
  }

  static toPersistence(entity: UserEntity): Partial<UserModel> {
    return {
      id: entity.id,
      email: entity.email.value,
      displayName: entity.displayName,
      avatarUrl: entity.avatarUrl,
    };
  }
}
```

#### Repository Implementation Pattern

```typescript
// apps/user/src/infrastructure/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../application/ports/user.repository.port';
import { UserEntity } from '../../domain/entities/user/user.entity';
import { UserModel } from '../models/user.model';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repo: Repository<UserModel>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    const model = await this.repo.findOne({ where: { id } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const model = await this.repo.findOne({ where: { email } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async save(user: UserEntity): Promise<void> {
    const model = UserMapper.toPersistence(user);
    await this.repo.save(model);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

#### REST Controller Pattern

```typescript
// apps/user/src/infrastructure/controllers/user.controller.ts
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id/get-user-by-id.query';
import { CreateUserDto, UserResponseDto } from '../dtos/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<{ id: string }> {
    const id = await this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.displayName, dto.keycloakId),
    );
    return { id };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(id));
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }
}
```

### Error Handling Patterns

#### Domain Exception Base

```typescript
// packages/domain/src/exceptions/domain.exception.ts
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}
```

#### Specific Domain Exceptions

```typescript
// apps/user/src/domain/exceptions/user-not-found.exception.ts
import { DomainException } from '@packages/domain';

export class UserNotFoundException extends DomainException {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = 404;

  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

// apps/user/src/domain/exceptions/email-already-exists.exception.ts
export class EmailAlreadyExistsException extends DomainException {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}
```

#### Global Exception Filter

```typescript
// packages/common/src/filters/domain-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainException } from '@packages/domain';
import { Response } from 'express';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### API Response Patterns

#### Standard Response Format

```typescript
// packages/common/src/dtos/api-response.dto.ts

// Success response (single item)
interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
  };
}

// Success response (paginated list)
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error response
interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

### Testing Patterns

#### Unit Test Pattern (Domain Entity)

```typescript
// apps/user/test/unit/domain/user.entity.spec.ts
describe('UserEntity', () => {
  describe('create', () => {
    it('should create user with valid props and emit UserCreatedEvent', () => {
      const user = UserEntity.create({
        email: EmailVO.create('test@example.com'),
        displayName: 'Test User',
        avatarUrl: null,
      });

      expect(user.email.value).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserCreatedEvent);
    });
  });

  describe('updateDisplayName', () => {
    it('should throw when name is too short', () => {
      const user = createTestUser();
      expect(() => user.updateDisplayName('A')).toThrow(InvalidDisplayNameException);
    });
  });
});
```

#### Integration Test Pattern (Repository)

```typescript
// apps/user/test/integration/repositories/user.repository.spec.ts
describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test database
  });

  afterEach(async () => {
    await dataSource.getRepository(UserModel).clear();
  });

  it('should save and retrieve user', async () => {
    const user = UserEntity.create({
      email: EmailVO.create('test@example.com'),
      displayName: 'Test',
      avatarUrl: null,
    });

    await repository.save(user);
    const found = await repository.findById(user.id);

    expect(found).not.toBeNull();
    expect(found!.email.value).toBe('test@example.com');
  });
});
```

### Critical Rules for AI Agents

#### MUST DO
1. **Always use factory methods** (`Entity.create()`, `Entity.reconstitute()`) - never `new Entity()`
2. **Business logic in domain entities** - application services only orchestrate
3. **Separate domain entities from ORM models** - use mappers for conversion
4. **Emit domain events** on state changes - publish after persistence
5. **Use value objects** for validated types (email, phone, URL, etc.)
6. **Follow CQRS** - separate command handlers from query handlers
7. **Inject ports via symbols** - `@Inject(USER_REPOSITORY)`
8. **Return domain entities from repositories** - not ORM models

#### MUST NOT DO
1. **Never import ORM decorators in domain layer** - keep domain pure
2. **Never call repository directly from controller** - go through command/query bus
3. **Never put validation logic in controllers** - use class-validator DTOs
4. **Never expose entity props directly** - use getters with encapsulation
5. **Never mutate entity props from outside** - use behavior methods
6. **Never skip the mapper** - always convert between entity and model
7. **Never throw generic errors** - use typed domain exceptions
8. **Never use `any` type** - define proper interfaces

### Service Communication Patterns

#### gRPC Service Definition

```protobuf
// proto/user.proto
syntax = "proto3";
package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc GetUsersByIds(GetUsersByIdsRequest) returns (UsersResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message UserResponse {
  string id = 1;
  string email = 2;
  string display_name = 3;
  optional string avatar_url = 4;
}
```

#### gRPC Client Pattern

```typescript
// apps/post/src/infrastructure/clients/user.client.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { IUserClient } from '../../application/ports/user.client.port';

@Injectable()
export class UserClientImpl implements IUserClient, OnModuleInit {
  private userService: UserServiceClient;

  @Client(grpcClientOptions('user'))
  private client: ClientGrpc;

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  async getUser(userId: string): Promise<UserDto | null> {
    try {
      return await firstValueFrom(
        this.userService.getUser({ userId }),
      );
    } catch (error) {
      if (error.code === status.NOT_FOUND) return null;
      throw error;
    }
  }
}
```

### Event Publishing Pattern

#### Event Publisher Port

```typescript
// packages/domain/src/ports/event-publisher.port.ts
import { DomainEvent } from '../core/domain-event';

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
```

#### Kafka Event Publisher

```typescript
// packages/infrastructure/src/kafka/kafka-event-publisher.ts
import { Injectable } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { IEventPublisher, DomainEvent } from '@packages/domain';

@Injectable()
export class KafkaEventPublisher implements IEventPublisher {
  constructor(private readonly producer: Producer) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic: this.getTopicName(event),
      messages: [
        {
          key: event.eventId,
          value: JSON.stringify({
            eventId: event.eventId,
            eventName: event.eventName,
            occurredOn: event.occurredOn.toISOString(),
            payload: event,
          }),
        },
      ],
    });
  }

  async publishAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }

  private getTopicName(event: DomainEvent): string {
    // user.created -> domain.user.events
    const [domain] = event.eventName.split('.');
    return `domain.${domain}.events`;
  }
}
```

### Module Wiring Pattern

```typescript
// apps/user/src/user.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { UserModel } from './infrastructure/models/user.model';

// Repositories
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository';
import { USER_REPOSITORY } from './application/ports/user.repository.port';

// Commands
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';

// Queries
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';

// Controllers
import { UserController } from './infrastructure/controllers/user.controller';

const CommandHandlers = [CreateUserHandler];
const QueryHandlers = [GetUserByIdHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserModel]),
  ],
  controllers: [UserController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
```

## Architecture Finalization & Review

_This section consolidates all architectural decisions, identifies risks, and establishes implementation priorities._

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SPROUX SOCIAL PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│    ┌─────────────────────────────────────────────────────────────────────────────┐  │
│    │                         CLIENT LAYER                                        │  │
│    │    Mobile Apps (iOS/Android)  │  Web App  │  Admin Dashboard               │  │
│    └─────────────────────────────────────────────────────────────────────────────┘  │
│                    │ REST API           │ WebSocket          │ REST                 │
│                    ▼                    ▼                    ▼                      │
│    ┌─────────────────────────────────────────────────────────────────────────────┐  │
│    │                     API GATEWAY (Kong/Nginx)                                │  │
│    │    • Rate Limiting (1000 req/min)  • JWT Validation  • Load Balancing       │  │
│    └─────────────────────────────────────────────────────────────────────────────┘  │
│                    │                    │                    │                      │
│    ┌──────────────────────────────────────────────────────────────────────────────┐ │
│    │                      MICROSERVICES LAYER                                     │ │
│    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  ┌──────────────┐    │ │
│    │  │  AUTH   │  │  USER   │  │  POST   │  │  MESSAGE  │  │ NOTIFICATION │    │ │
│    │  │         │  │         │  │         │  │           │  │              │    │ │
│    │  │ OAuth2  │  │ Profile │  │ Posts   │  │ Chat      │  │ In-app       │    │ │
│    │  │ JWT     │  │ Friends │  │ Feed    │  │ Presence  │  │ Push (FCM)   │    │ │
│    │  │ Session │  │ Block   │  │ Search  │  │ WebSocket │  │ Aggregation  │    │ │
│    │  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬─────┘  └──────┬───────┘    │ │
│    │       │            │            │             │               │            │ │
│    │       └────────────┴────────────┴─────────────┴───────────────┘            │ │
│    │                              │ gRPC (internal)                              │ │
│    └──────────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                                 │
│    ┌──────────────────────────────────────────────────────────────────────────────┐ │
│    │                        EVENT BUS (Kafka)                                     │ │
│    │    Topics: domain.user.events │ domain.post.events │ domain.message.events  │ │
│    └──────────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                                 │
│    ┌──────────────────────────────────────────────────────────────────────────────┐ │
│    │                         DATA LAYER                                           │ │
│    │  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  ┌─────────────────┐  │ │
│    │  │  PostgreSQL  │  │    Redis    │  │ Elasticsearch │  │     MinIO       │  │ │
│    │  │              │  │             │  │               │  │                 │  │ │
│    │  │ • Users      │  │ • Cache     │  │ • User search │  │ • Images        │  │ │
│    │  │ • Posts      │  │ • Sessions  │  │ • Post search │  │ • Videos        │  │ │
│    │  │ • Friends    │  │ • Presence  │  │ • Hashtags    │  │ • Attachments   │  │ │
│    │  │ • Messages   │  │ • Pub/Sub   │  │               │  │                 │  │ │
│    │  └──────────────┘  └─────────────┘  └───────────────┘  └─────────────────┘  │ │
│    └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│    ┌──────────────────────────────────────────────────────────────────────────────┐ │
│    │                    EXTERNAL SERVICES                                         │ │
│    │  ┌────────────┐  ┌─────────────────┐  ┌──────────────────────────────────┐  │ │
│    │  │  Keycloak  │  │  FCM / APNs     │  │  LLM Provider (Phase 5)          │  │ │
│    │  │  (OAuth2)  │  │  (Push Notify)  │  │  (AI Chatbot)                    │  │ │
│    │  └────────────┘  └─────────────────┘  └──────────────────────────────────┘  │ │
│    └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│    ┌──────────────────────────────────────────────────────────────────────────────┐ │
│    │                    OBSERVABILITY                                             │ │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│    │  │ OpenTelemetry│  │ Prometheus  │  │    ELK     │  │ Health Checks       │ │ │
│    │  │ (Tracing)   │  │ (Metrics)   │  │ (Logging)  │  │ (K8s Readiness)     │ │ │
│    │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│    └──────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Decision Records (ADR) Summary

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| ADR-001 | 5 consolidated microservices | Reduce complexity while maintaining separation of concerns | Accepted |
| ADR-002 | PostgreSQL for all data (Phase 1-2) | Ship faster, migrate later for learning | Accepted |
| ADR-003 | REST + WebSocket + gRPC protocols | Appropriate tool for each use case | Accepted |
| ADR-004 | GraphQL deferred to Phase 6 | Not needed initially, adds complexity | Accepted |
| ADR-005 | Hybrid authorization (Keycloak + App) | Identity roles centralized, resource permissions in app | Accepted |
| ADR-006 | CQRS pattern for all services | Scalability, clear separation of read/write | Accepted |
| ADR-007 | Domain Events via Kafka | Decoupling, audit trail, eventual consistency | Accepted |
| ADR-008 | Separate ORM models from domain entities | Clean architecture, testability | Accepted |

### Risk Analysis

#### High-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **WebSocket scaling** | Real-time features fail at scale | Redis Pub/Sub for cross-instance coordination, sticky sessions |
| **Feed fan-out performance** | Slow feed delivery (>1s target) | Hybrid push/pull model, pre-computed feeds for active users |
| **Kafka message ordering** | Out-of-order event processing | Partition by aggregate ID, idempotent consumers |
| **DDD refactoring scope** | Delays Phase 1 delivery | Prioritize AggregateRoot + Events first, defer other improvements |

#### Medium-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Multi-database complexity** | Increased operational burden | Start with PostgreSQL only, add others incrementally |
| **gRPC learning curve** | Slower service communication implementation | Start with simple services, good documentation |
| **Elasticsearch sync** | Search data becomes stale | Event-driven indexing via Kafka consumers |

#### Low-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **NestJS CQRS adoption** | Team learning curve | Good documentation, existing @nestjs/cqrs support |
| **TypeORM limitations** | Complex queries difficult | Use QueryBuilder for complex cases, raw SQL if needed |

### Implementation Priority Matrix

#### Phase 1: Foundation (DDD + Core Services)

| Priority | Component | Dependency | Complexity |
|----------|-----------|------------|------------|
| P0 | AggregateRoot base class | None | Low |
| P0 | DomainEvent base class | None | Low |
| P0 | Entity base class refactor | AggregateRoot | Medium |
| P0 | Event publisher port | DomainEvent | Low |
| P1 | User service (profile CRUD) | Entity refactor | Medium |
| P1 | Auth service (OAuth flow) | User service | Medium |
| P2 | Friend service (requests, accept) | User service | Medium |

#### Phase 2: Content & Social

| Priority | Component | Dependency | Complexity |
|----------|-----------|------------|------------|
| P0 | Post service (CRUD) | User service | Medium |
| P1 | Reaction/Comment system | Post service | Medium |
| P1 | Feed generation | Post + Friend | High |
| P2 | Elasticsearch integration | Post service | Medium |
| P2 | Hashtag extraction | Post service | Low |

#### Phase 3: Real-time

| Priority | Component | Dependency | Complexity |
|----------|-----------|------------|------------|
| P0 | WebSocket gateway setup | None | Medium |
| P0 | Presence service | WebSocket + Redis | Medium |
| P1 | Message service (1:1 chat) | WebSocket + User | High |
| P1 | Group chat | Message service | Medium |
| P2 | Typing indicators | WebSocket | Low |
| P2 | Read receipts | Message service | Low |

#### Phase 4: Notifications

| Priority | Component | Dependency | Complexity |
|----------|-----------|------------|------------|
| P0 | Notification service | Kafka consumers | Medium |
| P1 | Push notification (FCM) | Notification service | Medium |
| P2 | Notification aggregation | Notification service | Medium |

#### Phase 5: AI Features

| Priority | Component | Dependency | Complexity |
|----------|-----------|------------|------------|
| P1 | AI chatbot integration | LLM provider | High |
| P2 | Feed summarization | AI + Feed | Medium |
| P2 | Content suggestions | AI + Post | Medium |

### Technical Debt Considerations

#### Accepted Technical Debt (Phase 1-2)

| Debt | Reason | Resolution Timeline |
|------|--------|---------------------|
| PostgreSQL for messages | Ship faster | Phase 3 (MongoDB migration) |
| No GraphQL gateway | Not needed initially | Phase 6 |
| Basic caching strategy | Learn access patterns first | Phase 2-3 |
| Single region deployment | Complexity reduction | Post-MVP |

#### Debt to Avoid

| Anti-Pattern | Why Avoid |
|--------------|-----------|
| Anemic domain models | Defeats DDD purpose, harder to refactor later |
| Skipping mappers | Couples domain to infrastructure |
| `any` types | Type safety is critical for maintainability |
| Business logic in controllers | Violates clean architecture |

### Migration Strategy (Phase 3+)

#### Messages: PostgreSQL → MongoDB

```
Phase 3 Migration Steps:
1. Create MongoDB message repository (implements same port)
2. Deploy with feature flag (new conversations → MongoDB)
3. Run dual-write for existing conversations
4. Batch migrate historical messages
5. Remove PostgreSQL message tables
```

#### Feed: PostgreSQL → Cassandra (Optional)

```
Evaluation Criteria:
- If feed queries > 10,000/sec sustained
- If write amplification becomes bottleneck
- If read latency > 50ms p95

Migration approach: Same repository port pattern
```

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API p95 latency | < 100ms | Prometheus histograms |
| Feed delivery time | < 1s | End-to-end tracing |
| Message delivery time | < 200ms | WebSocket metrics |
| WebSocket connections | 1,000+ concurrent | Connection pool metrics |
| Search latency | < 200ms | Elasticsearch metrics |
| Uptime | 99.5% | Health check aggregation |
| Error rate | < 0.1% | Log analysis |

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DEVELOPMENT                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   docker-compose.yml                                                             │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │  postgres:5432  redis:6379  elasticsearch:9200  kafka:29092  minio:9000   │ │
│   │  keycloak:8080  zookeeper:2181                                            │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│   NestJS Services (local)                                                        │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │  auth:3001  user:3002  post:3003  message:3004  notification:3005         │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION (Future)                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Kubernetes Cluster                                                             │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │  Namespace: sproux-prod                                                    │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │ │
│   │  │ auth (2-4)  │  │ user (2-4)  │  │ post (2-4)  │                        │ │
│   │  │ replicas    │  │ replicas    │  │ replicas    │                        │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                        │ │
│   │  ┌─────────────────────┐  ┌─────────────────────┐                         │ │
│   │  │ message (3-6)       │  │ notification (2-4)  │                         │ │
│   │  │ replicas (sticky)   │  │ replicas            │                         │ │
│   │  └─────────────────────┘  └─────────────────────┘                         │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│   Managed Services                                                               │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │  RDS PostgreSQL  │  ElastiCache Redis  │  MSK Kafka  │  S3 (media)        │ │
│   │  OpenSearch      │  CloudFront (CDN)   │                                   │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Checklist for AI Agents

Before implementing any feature, verify:

- [ ] Feature maps to correct microservice (auth/user/post/message/notification)
- [ ] Domain entity uses factory methods (create/reconstitute)
- [ ] Business logic lives in domain entity, not application service
- [ ] Repository returns domain entity, not ORM model
- [ ] Mapper exists for entity ↔ model conversion
- [ ] Domain events emitted on state changes
- [ ] Command/Query follows CQRS separation
- [ ] Controller uses CommandBus/QueryBus, not direct repo
- [ ] DTOs validated with class-validator decorators
- [ ] Domain exceptions extend DomainException base
- [ ] Tests cover: unit (domain), integration (repo), e2e (API)
- [ ] OpenAPI decorators on controller methods

### Document Status

| Section | Status |
|---------|--------|
| Project Context Analysis | ✅ Complete |
| Starter Template Evaluation | ✅ Complete |
| Core Architectural Decisions | ✅ Complete |
| Implementation Patterns | ✅ Complete |
| Architecture Finalization | ✅ Complete |

**Architecture Document Status: COMPLETE**

_Ready for Epics & Stories creation._
