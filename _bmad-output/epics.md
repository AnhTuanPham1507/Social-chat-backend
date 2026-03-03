---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
---

# sproux-service - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for sproux-service, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Account & Authentication (FR1-FR8)**
- FR1: Users can authenticate via OAuth2/OIDC through external identity provider (Keycloak)
- FR2: Users can view and update their profile information (name, avatar)
- FR3: Users can upload profile pictures
- FR4: Users can register device tokens for push notifications
- FR5: Users can log out from the platform
- FR6: System can validate JWT tokens and extract user claims
- FR7: System can enforce role-based access control (RBAC) on protected endpoints
- FR8: System can enforce scope-based permissions on API operations

**Content Creation & Management (FR9-FR19)**
- FR9: Users can create posts with text content
- FR10: Users can attach multiple images to a post
- FR11: Users can attach videos to a post
- FR12: Users can specify audience visibility for their posts (public, friends-only, specific groups)
- FR13: Users can view a specific post and its details
- FR14: Users can delete their own posts
- FR15: Users can react to posts (multiple reaction types)
- FR16: Users can comment on posts
- FR17: Users can view comments on a post
- FR18: Users can share posts to their own feed
- FR19: System can extract hashtags from post content

**Social Connections (FR20-FR27)**
- FR20: Users can send friend requests to other users
- FR21: Users can accept or decline incoming friend requests
- FR22: Users can view their list of friends
- FR23: Users can unfriend existing friends
- FR24: Users can block other users
- FR25: Users can unblock previously blocked users
- FR26: Users can view suggested friends
- FR27: System can maintain symmetric friend relationships

**Content Discovery & Feed (FR28-FR32)**
- FR28: Users can view their personalized home feed
- FR29: Users can receive real-time feed updates when connected
- FR30: System can fan-out new posts to friends' feeds within 1 second
- FR31: Users can pull-to-refresh their feed for new content
- FR32: Users can view older feed content via pagination/infinite scroll

**Real-time Messaging (FR33-FR44)**
- FR33: Users can start a one-on-one conversation with another user
- FR34: Users can create group conversations with multiple users
- FR35: Users can send text messages in conversations
- FR36: Users can send images in conversations
- FR37: Users can send files in conversations
- FR38: Users can view message history in a conversation
- FR39: Users can receive messages in real-time when connected
- FR40: Users can see read receipts on their sent messages
- FR41: Users can see delivery status on their sent messages
- FR42: Users can view the list of their conversations
- FR43: Group members can add new members to group conversations
- FR44: Group members can leave group conversations

**Notifications & Engagement (FR45-FR53)**
- FR45: Users can view their notification list
- FR46: Users can see unread notification count
- FR47: Users can mark notifications as read
- FR48: Users can mark all notifications as read
- FR49: System can send in-app notifications for friend requests
- FR50: System can send in-app notifications for new posts from friends
- FR51: System can send in-app notifications for reactions and comments
- FR52: System can send push notifications to mobile devices
- FR53: System can aggregate multiple similar notifications

**Presence & Status (FR54-FR57)**
- FR54: Users can see online/offline status of other users
- FR55: Users can see typing indicators when others are typing in a conversation
- FR56: System can track user presence via heartbeat mechanism
- FR57: System can update presence status when users connect/disconnect

**AI Chatbot (FR58-FR65)**
- FR58: Users can start a conversation with the AI chatbot
- FR59: Users can ask the AI chatbot general questions
- FR60: Users can ask the AI chatbot for help with platform features
- FR61: Users can request AI to summarize their feed or conversations
- FR62: Users can request AI suggestions for post content
- FR63: Users can request AI to recommend friends or content based on interests
- FR64: System can maintain conversation context within a chat session
- FR65: System can stream AI responses in real-time for better UX

### NonFunctional Requirements

**Performance**
- NFR1: Feed delivery latency < 1 second (time from post creation to WebSocket push)
- NFR2: API response time p95 < 100ms
- NFR3: API response time p99 < 500ms
- NFR4: Message delivery latency < 200ms
- NFR5: Search query response < 200ms
- NFR6: WebSocket connection time < 500ms
- NFR7: AI response first token < 1 second

**Security**
- NFR8: OAuth2/OIDC authentication via Keycloak with JWT tokens
- NFR9: JWKS token validation for all protected endpoints
- NFR10: RBAC enforced at API gateway and service level
- NFR11: TLS 1.3 for all external communication
- NFR12: Encryption for sensitive data at rest
- NFR13: Rate limiting per user (1000 req/min) and per endpoint
- NFR14: Input validation/sanitization to prevent injection attacks
- NFR15: No hardcoded secrets - use environment variables

**Scalability**
- NFR16: Support 1,000+ concurrent WebSocket connections
- NFR17: Message throughput 1,000+ msg/sec
- NFR18: Horizontal scaling for stateless services
- NFR19: Database read replicas support
- NFR20: Cache hit ratio > 80%
- NFR21: Feed fan-out to 1,000 friends in < 1s

**Reliability**
- NFR22: Service availability 99.5% uptime
- NFR23: At-least-once message delivery via Kafka
- NFR24: No data loss - database replication and backups
- NFR25: Graceful degradation with circuit breakers and fallbacks
- NFR26: Zero-downtime deployments (blue-green or rolling)

**Observability**
- NFR27: Distributed tracing with OpenTelemetry/Jaeger
- NFR28: Metrics collection with Prometheus
- NFR29: Log aggregation with ELK Stack
- NFR30: Grafana dashboards for real-time monitoring
- NFR31: Health endpoints (/health/live, /health/ready) per service

### Additional Requirements

**From Architecture - DDD Improvements (Priority for Phase 1)**
- Create AggregateRoot base class extending Entity with domain events collection
- Refactor entities to use factory methods (create(), reconstitute()) instead of public constructors
- Implement DomainEvent base class and event publishing system
- Separate ORM models from domain entities with mapper pattern
- Business logic must reside in domain entities, not application services

**From Architecture - Service Structure**
- 5 consolidated microservices: auth, user, post, message, notification
- Follow CQRS pattern with command/query separation
- Use gRPC for internal service-to-service communication
- REST for external client API
- WebSocket for real-time features

**From Architecture - Database Strategy**
- Phase 1-2: PostgreSQL for all data, Redis for cache/sessions/presence, Elasticsearch for search
- Phase 3+: Migrate messages to MongoDB (optional: feed to Cassandra)
- Repository pattern to enable storage layer swapping

**From Architecture - API Security**
- Hybrid authorization: Keycloak for identity roles, application for resource permissions
- Rate limiting: 1000 req/min per user via Redis sliding window
- JWT validation via JWKS from Keycloak

**From Architecture - Infrastructure**
- Docker Compose for local development
- Kafka for event streaming and domain event publishing
- MinIO for object storage (images, videos, attachments)
- Keycloak as identity provider

**From Architecture - Existing Foundation**
- Building on existing NestJS monorepo structure
- Auth service already partially implemented with Keycloak OAuth2/OIDC
- User service exists with basic structure
- Need to apply DDD improvements before adding new features

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR8 | Epic 2 | User Identity & Authentication |
| FR9-FR19 | Epic 4 | Content Creation & Engagement |
| FR20-FR27 | Epic 3 | Social Network Building |
| FR28-FR32 | Epic 5 | Personalized Feed & Discovery |
| FR33-FR44 | Epic 6 | Real-time Messaging |
| FR45-FR53 | Epic 8 | Notifications & Activity |
| FR54-FR57 | Epic 7 | Presence & Status |
| FR58-FR65 | Epic 9 | AI-Powered Assistance |

## Epic List

1. **Epic 1: DDD Foundation & Architecture Patterns** - Establishes robust foundation for all features
2. **Epic 2: User Identity & Profile Management** - FR1-FR8 - Users can register, authenticate, manage profiles
3. **Epic 3: Social Network Building** - FR20-FR27 - Users can build and manage social connections
4. **Epic 4: Content Creation & Engagement** - FR9-FR19 - Users can create content and engage
5. **Epic 5: Personalized Feed & Discovery** - FR28-FR32 - Users can discover content from network
6. **Epic 6: Real-time Messaging & Conversations** - FR33-FR44 - Users can communicate privately
7. **Epic 7: Presence & Real-time Status** - FR54-FR57 - Users can see who's online
8. **Epic 8: Notifications & Activity Updates** - FR45-FR53 - Users stay informed about activity
9. **Epic 9: AI-Powered Assistance** - FR58-FR65 - Users get intelligent help

---

## Epic 1: DDD Foundation & Architecture Patterns

**Goal:** Establish the robust architectural foundation required for all features to be built correctly, maintainably, and according to DDD/Clean Architecture principles.

### Story 1.1: Create Core Domain Base Classes

As a developer,
I want AggregateRoot, Entity, and ValueObject base classes in the domain package,
So that all domain entities follow consistent DDD patterns.

**Acceptance Criteria:**

**Given** the packages/domain directory exists
**When** I create the core base classes
**Then** Entity base class exists with id property and equality comparison
**And** AggregateRoot extends Entity with domainEvents collection and addDomainEvent/clearEvents methods
**And** ValueObject base class exists with props-based equality
**And** All classes use generics for type safety
**And** No external framework dependencies in domain layer

---

### Story 1.2: Implement Domain Event Infrastructure

As a developer,
I want a DomainEvent base class and event publisher interface,
So that domain entities can emit events that are published after persistence.

**Acceptance Criteria:**

**Given** the AggregateRoot base class exists
**When** I implement the domain event infrastructure
**Then** DomainEvent base class exists with eventId, eventName, and occurredOn properties
**And** IEventPublisher port interface exists with publish() and publishAll() methods
**And** EVENT_PUBLISHER injection token is defined
**And** DomainEvents can be serialized to JSON for Kafka

---

### Story 1.3: Set Up Kafka Event Publisher

As a developer,
I want a Kafka-based event publisher implementation,
So that domain events are reliably published to Kafka topics.

**Acceptance Criteria:**

**Given** IEventPublisher port exists
**When** I implement the Kafka event publisher
**Then** KafkaEventPublisher class implements IEventPublisher
**And** Events are published to topics named domain.{aggregate}.events
**And** Event payload includes eventId, eventName, occurredOn, and event data
**And** Publisher is registered in infrastructure module
**And** Kafka connection is configured via environment variables

---

### Story 1.4: Refactor User Entity to Rich Domain Model

As a developer,
I want the User entity refactored to a rich domain model with factory methods,
So that it serves as the template for all future entities.

**Acceptance Criteria:**

**Given** the current User entity exists
**When** I refactor it to a rich domain model
**Then** UserEntity extends AggregateRoot
**And** Private constructor with create() and reconstitute() factory methods
**And** EmailVO value object validates email format
**And** Business methods exist for updateDisplayName(), updateAvatar()
**And** UserCreatedEvent is emitted in create() method
**And** UserModel (TypeORM) is separate from UserEntity
**And** UserMapper converts between entity and model

---

### Story 1.5: Establish CQRS Infrastructure

As a developer,
I want CQRS infrastructure with CommandBus and QueryBus,
So that read and write operations are properly separated.

**Acceptance Criteria:**

**Given** @nestjs/cqrs is available
**When** I set up the CQRS infrastructure
**Then** CqrsModule is imported in service modules
**And** Sample CreateUserCommand and CreateUserHandler demonstrate command pattern
**And** Sample GetUserByIdQuery and GetUserByIdHandler demonstrate query pattern
**And** Controllers use commandBus.execute() and queryBus.execute()
**And** Handlers inject repository via port symbols

---

## Epic 2: User Identity & Profile Management

**Goal:** Users can securely register, authenticate via OAuth2/OIDC, and manage their personal profiles.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Story 2.1: OAuth2/OIDC Authentication Flow

As a user,
I want to authenticate using my existing identity provider (Google, etc.) via Keycloak,
So that I don't need to create another username/password.

**Acceptance Criteria:**

**Given** Keycloak is configured with OAuth2/OIDC
**When** I initiate login
**Then** I am redirected to Keycloak authorization endpoint
**And** After successful authentication, I receive an authorization code
**And** The backend exchanges the code for access and refresh tokens
**And** JWT access token contains user claims (sub, email, roles)
**And** Tokens are returned to the client

---

### Story 2.2: JWT Token Validation

As the system,
I want to validate JWT tokens on protected endpoints,
So that only authenticated users can access protected resources.

**Acceptance Criteria:**

**Given** a request with Authorization header
**When** the JwtGuard processes the request
**Then** Token signature is verified against Keycloak JWKS endpoint
**And** Token expiration is checked
**And** User claims are extracted and attached to request
**And** Invalid tokens return 401 Unauthorized
**And** Missing tokens on protected routes return 401 Unauthorized

---

### Story 2.3: User Profile Creation on First Login

As a new user,
I want my profile created automatically on first login,
So that I can start using the platform immediately.

**Acceptance Criteria:**

**Given** I have authenticated successfully via Keycloak
**When** it's my first login (no user record exists)
**Then** A new user record is created with Keycloak sub as identifier
**And** Email is extracted from token claims
**And** Default display name is set from token (or email prefix)
**And** UserCreatedEvent is published to Kafka
**And** User profile is returned in response

---

### Story 2.4: Update User Profile

As a user,
I want to update my display name,
So that others can recognize me.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send PUT /users/profile with name
**Then** My profile is updated with the new value
**And** Display name is validated (2-50 characters)
**And** updatedAt timestamp is refreshed
**And** Updated profile is returned

---

### Story 2.5: Upload Profile Picture

As a user,
I want to upload a profile picture,
So that others can recognize me visually.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I upload an image to POST /users/avatar
**Then** Image is uploaded to MinIO storage
**And** Image URL is stored in my user profile
**And** Old avatar is deleted if exists
**And** Only image formats (jpg, png, gif, webp) are accepted
**And** File size is limited to 5MB
**And** Avatar URL is returned in response

---

### Story 2.6: Register Device Token for Push Notifications

As a user,
I want to register my device token,
So that I can receive push notifications on my mobile device.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send POST /users/devices with deviceToken and platform
**Then** Device token is stored associated with my user
**And** Platform is validated (ios, android)
**And** Duplicate tokens are ignored
**And** Old tokens for same device are replaced
**And** Success response is returned

---

### Story 2.7: User Logout

As a user,
I want to log out of the platform,
So that my session is terminated securely.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send POST /auth/logout
**Then** My refresh token is invalidated
**And** Device tokens are optionally cleared
**And** Success response is returned
**And** Subsequent requests with old tokens are rejected

---

### Story 2.8: RBAC Guard Implementation

As the system,
I want to enforce role-based access control on endpoints,
So that users can only access resources appropriate to their role.

**Acceptance Criteria:**

**Given** user roles are in JWT claims
**When** a request hits a protected endpoint with @Roles decorator
**Then** RolesGuard checks user has required role
**And** Admin-only endpoints reject non-admin users with 403
**And** Multiple roles can be specified (OR logic)
**And** @Public decorator bypasses authentication entirely

---

## Epic 3: Social Network Building

**Goal:** Users can build, manage, and curate their social connections through friend requests and blocking.

**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Story 3.1: Send Friend Request

As a user,
I want to send a friend request to another user,
So that I can connect with them on the platform.

**Acceptance Criteria:**

**Given** I am authenticated and target user exists
**When** I send POST /friends/request with targetUserId
**Then** A friend request record is created with status PENDING
**And** I cannot send request to myself
**And** I cannot send request to someone who blocked me
**And** I cannot send duplicate pending requests
**And** FriendRequestSentEvent is published
**And** Request details are returned

---

### Story 3.2: Accept or Decline Friend Request

As a user,
I want to accept or decline incoming friend requests,
So that I can control who is in my network.

**Acceptance Criteria:**

**Given** I have a pending friend request
**When** I send PUT /friends/request/:id with action (accept/decline)
**Then** If accepted, symmetric friend relationship is created
**And** If declined, request status is set to DECLINED
**And** FriendRequestAcceptedEvent or FriendRequestDeclinedEvent is published
**And** Only the request recipient can accept/decline
**And** Updated status is returned

---

### Story 3.3: View Friends List

As a user,
I want to view my list of friends,
So that I can see who I'm connected with.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send GET /friends
**Then** Paginated list of my friends is returned
**And** Each friend includes id, displayName, avatarUrl
**And** Results can be sorted by name or friendshipDate
**And** Total count is included in response

---

### Story 3.4: Unfriend User

As a user,
I want to unfriend someone,
So that I can remove them from my network.

**Acceptance Criteria:**

**Given** I have an existing friendship
**When** I send DELETE /friends/:userId
**Then** The symmetric friendship is removed
**And** Both users no longer see each other in friends list
**And** FriendRemovedEvent is published
**And** Success response is returned

---

### Story 3.5: Block User

As a user,
I want to block another user,
So that they cannot interact with me.

**Acceptance Criteria:**

**Given** I am authenticated and target user exists
**When** I send POST /users/:userId/block
**Then** Block record is created
**And** Any existing friendship is removed
**And** Blocked user cannot send me friend requests
**And** Blocked user cannot message me
**And** Blocked user's content is hidden from my feed
**And** UserBlockedEvent is published

---

### Story 3.6: Unblock User

As a user,
I want to unblock a previously blocked user,
So that they can interact with me again.

**Acceptance Criteria:**

**Given** I have blocked a user
**When** I send DELETE /users/:userId/block
**Then** Block record is removed
**And** User can now send me friend requests
**And** User can now message me
**And** UserUnblockedEvent is published

---

### Story 3.7: View Friend Suggestions

As a user,
I want to see suggested friends,
So that I can discover people to connect with.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send GET /friends/suggestions
**Then** List of suggested users is returned
**And** Suggestions exclude existing friends
**And** Suggestions exclude blocked users
**And** Suggestions exclude users who blocked me
**And** Suggestions are based on mutual friends count
**And** Each suggestion includes mutualFriendsCount

---

## Epic 4: Content Creation & Engagement

**Goal:** Users can create rich content with media and engage with others' posts through reactions and comments.

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Story 4.1: Create Text Post

As a user,
I want to create a post with text content,
So that I can share my thoughts with others.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send POST /posts with content
**Then** Post record is created with my userId
**And** Content is validated (1-5000 characters)
**And** CreatedAt and updatedAt timestamps are set
**And** PostCreatedEvent is published
**And** Post details are returned with id

---

### Story 4.2: Attach Images to Post

As a user,
I want to attach multiple images to my post,
So that I can share visual content.

**Acceptance Criteria:**

**Given** I am creating or editing a post
**When** I include imageUrls array in the request
**Then** Images are associated with the post
**And** Maximum 10 images per post
**And** Image URLs are validated (must be from our MinIO storage)
**And** Images are displayed in order provided

---

### Story 4.3: Attach Videos to Post

As a user,
I want to attach videos to my post,
So that I can share video content.

**Acceptance Criteria:**

**Given** I am creating or editing a post
**When** I include videoUrls array in the request
**Then** Videos are associated with the post
**And** Maximum 1 video per post
**And** Video URLs are validated
**And** Video thumbnail is generated/stored

---

### Story 4.4: Set Post Audience Visibility

As a user,
I want to specify who can see my post,
So that I can control my content's visibility.

**Acceptance Criteria:**

**Given** I am creating a post
**When** I specify visibility (public, friends, specific)
**Then** Post visibility is set accordingly
**And** PUBLIC posts are visible to everyone
**And** FRIENDS posts are visible only to my friends
**And** SPECIFIC posts are visible to specified user IDs
**And** Default visibility is FRIENDS

---

### Story 4.5: View Post Details

As a user,
I want to view a specific post and its details,
So that I can see the full content and engagement.

**Acceptance Criteria:**

**Given** the post exists and I have permission to view it
**When** I send GET /posts/:id
**Then** Post details are returned
**And** Author info (id, displayName, avatarUrl) is included
**And** Reaction counts by type are included
**And** Comment count is included
**And** My reaction (if any) is included
**And** 404 returned if post doesn't exist or I lack permission

---

### Story 4.6: Delete Own Post

As a user,
I want to delete my own posts,
So that I can remove content I no longer want visible.

**Acceptance Criteria:**

**Given** I am the post author
**When** I send DELETE /posts/:id
**Then** Post is soft-deleted (or hard-deleted based on policy)
**And** Associated reactions and comments are handled
**And** PostDeletedEvent is published
**And** 403 returned if not the author
**And** Success response returned

---

### Story 4.7: React to Post

As a user,
I want to react to posts with different reaction types,
So that I can express my feelings about content.

**Acceptance Criteria:**

**Given** I can view the post
**When** I send POST /posts/:id/reactions with type
**Then** My reaction is recorded
**And** Supported types: LIKE, LOVE, HAHA, WOW, SAD, ANGRY
**And** Only one reaction per user per post (replaces previous)
**And** ReactionAddedEvent is published
**And** Updated reaction counts returned

---

### Story 4.8: Comment on Post

As a user,
I want to comment on posts,
So that I can participate in discussions.

**Acceptance Criteria:**

**Given** I can view the post
**When** I send POST /posts/:id/comments with content
**Then** Comment is created and associated with the post
**And** Content is validated (1-2000 characters)
**And** CommentAddedEvent is published
**And** Comment details returned with id and createdAt

---

### Story 4.9: View Comments on Post

As a user,
I want to view comments on a post,
So that I can see the discussion.

**Acceptance Criteria:**

**Given** the post exists and I can view it
**When** I send GET /posts/:id/comments
**Then** Paginated list of comments is returned
**And** Each comment includes author info
**And** Comments are sorted by createdAt (oldest first)
**And** Total count is included

---

### Story 4.10: Share Post

As a user,
I want to share a post to my own feed,
So that my friends can see content I find interesting.

**Acceptance Criteria:**

**Given** I can view the original post
**When** I send POST /posts/:id/share with optional comment
**Then** A new post is created referencing the original
**And** Share includes originalPostId
**And** My comment is optional additional text
**And** PostSharedEvent is published
**And** Shared post appears in my friends' feeds

---

### Story 4.11: Extract Hashtags from Post Content

As the system,
I want to automatically extract hashtags from post content,
So that posts can be discovered by topic.

**Acceptance Criteria:**

**Given** a post is created or updated
**When** the content contains hashtags (#word)
**Then** Hashtags are extracted and stored with the post
**And** Hashtags are normalized (lowercase, no duplicates)
**And** Maximum 30 hashtags per post
**And** Hashtags are indexed for search

---

## Epic 5: Personalized Feed & Discovery

**Goal:** Users can discover relevant content from their network with real-time updates.

**FRs covered:** FR28, FR29, FR30, FR31, FR32

### Story 5.1: View Home Feed

As a user,
I want to view my personalized home feed,
So that I can see content from my friends.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send GET /feed
**Then** Paginated feed of posts is returned
**And** Feed includes posts from my friends
**And** Feed includes my own posts
**And** Posts are sorted by createdAt (newest first)
**And** Each post includes author info and engagement counts

---

### Story 5.2: Feed Pagination and Infinite Scroll

As a user,
I want to load more feed content as I scroll,
So that I can see older posts.

**Acceptance Criteria:**

**Given** I am viewing my feed
**When** I request more content with cursor/offset
**Then** Next page of posts is returned
**And** Cursor-based pagination is supported
**And** No duplicate posts across pages
**And** Empty array when no more content

---

### Story 5.3: Real-time Feed Updates via WebSocket

As a user,
I want to receive new posts in real-time,
So that I see fresh content without refreshing.

**Acceptance Criteria:**

**Given** I am connected via WebSocket
**When** a friend publishes a new post
**Then** I receive the post via WebSocket push
**And** Post appears at top of my feed
**And** Notification indicates new content available
**And** Works across multiple browser tabs

---

### Story 5.4: Feed Fan-out on New Post

As the system,
I want to fan-out new posts to friends' feeds,
So that content is delivered within 1 second.

**Acceptance Criteria:**

**Given** a user creates a new post
**When** PostCreatedEvent is processed
**Then** Post is added to all friends' feed caches
**And** WebSocket notifications sent to online friends
**And** Fan-out completes in < 1 second for up to 1000 friends
**And** Kafka is used for reliable delivery

---

## Epic 6: Real-time Messaging & Conversations

**Goal:** Users can communicate privately with individuals or groups in real-time.

**FRs covered:** FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42, FR43, FR44

### Story 6.1: Start One-on-One Conversation

As a user,
I want to start a conversation with another user,
So that I can communicate privately.

**Acceptance Criteria:**

**Given** I am authenticated and target user exists
**When** I send POST /conversations with participantId
**Then** A conversation is created if doesn't exist
**And** Existing conversation is returned if one exists
**And** I cannot message users who blocked me
**And** Conversation details with participants returned

---

### Story 6.2: Send Text Message

As a user,
I want to send text messages in a conversation,
So that I can communicate with others.

**Acceptance Criteria:**

**Given** I am a participant in a conversation
**When** I send POST /conversations/:id/messages with content
**Then** Message is created and stored
**And** Content is validated (1-5000 characters)
**And** MessageSentEvent is published
**And** Message is delivered to other participants via WebSocket
**And** Message includes id, senderId, content, createdAt

---

### Story 6.3: View Message History

As a user,
I want to view message history in a conversation,
So that I can see past messages.

**Acceptance Criteria:**

**Given** I am a participant in a conversation
**When** I send GET /conversations/:id/messages
**Then** Paginated list of messages is returned
**And** Messages are sorted by createdAt (oldest first for chat UI)
**And** Each message includes sender info
**And** Cursor-based pagination supported for infinite scroll up

---

### Story 6.4: Real-time Message Delivery

As a user,
I want to receive messages in real-time,
So that I have instant communication.

**Acceptance Criteria:**

**Given** I am connected via WebSocket
**When** another user sends me a message
**Then** I receive the message via WebSocket push
**And** Message appears in the conversation immediately
**And** Delivery latency is < 200ms
**And** Works when I have multiple devices connected

---

### Story 6.5: Send Images in Chat

As a user,
I want to send images in conversations,
So that I can share visual content privately.

**Acceptance Criteria:**

**Given** I am a participant in a conversation
**When** I send a message with imageUrl
**Then** Image message is created and delivered
**And** Image URL must be from our storage
**And** Thumbnail is included for preview
**And** Message type is set to IMAGE

---

### Story 6.6: Send Files in Chat

As a user,
I want to send files in conversations,
So that I can share documents and other files.

**Acceptance Criteria:**

**Given** I am a participant in a conversation
**When** I send a message with fileUrl and fileName
**Then** File message is created and delivered
**And** File size limit is 25MB
**And** Message type is set to FILE
**And** fileName and fileSize are included in message

---

### Story 6.7: Message Delivery Status

As a user,
I want to see if my message was delivered,
So that I know the recipient received it.

**Acceptance Criteria:**

**Given** I sent a message
**When** the message reaches the recipient's device
**Then** Delivery status is updated to DELIVERED
**And** I see single checkmark (✓) indicator
**And** Status update is pushed via WebSocket

---

### Story 6.8: Read Receipts

As a user,
I want to see when my message was read,
So that I know the recipient saw it.

**Acceptance Criteria:**

**Given** I sent a message that was delivered
**When** recipient views the conversation
**Then** Read status is updated to READ
**And** I see double checkmark (✓✓) indicator
**And** ReadAt timestamp is recorded
**And** Status update is pushed via WebSocket

---

### Story 6.9: View Conversations List

As a user,
I want to view my list of conversations,
So that I can see all my chats.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send GET /conversations
**Then** List of my conversations is returned
**And** Sorted by last message time (newest first)
**And** Each includes participants, lastMessage preview
**And** Unread count per conversation is included

---

### Story 6.10: Create Group Conversation

As a user,
I want to create a group conversation,
So that I can chat with multiple people.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send POST /conversations/group with participantIds and name
**Then** Group conversation is created
**And** Minimum 2 other participants required
**And** Maximum 50 participants
**And** Group name is required (max 100 characters)
**And** I am automatically added as participant and admin

---

### Story 6.11: Add Members to Group

As a group admin,
I want to add new members to the group,
So that more people can join the conversation.

**Acceptance Criteria:**

**Given** I am admin of a group conversation
**When** I send POST /conversations/:id/members with userIds
**Then** Users are added to the group
**And** New members can see message history from join time
**And** MemberAddedEvent is published
**And** 403 if not admin

---

### Story 6.12: Leave Group Conversation

As a group member,
I want to leave a group conversation,
So that I no longer receive messages.

**Acceptance Criteria:**

**Given** I am a member of a group conversation
**When** I send DELETE /conversations/:id/members/me
**Then** I am removed from the group
**And** I no longer receive messages
**And** MemberLeftEvent is published
**And** If last admin leaves, oldest member becomes admin

---

## Epic 7: Presence & Real-time Status

**Goal:** Users can see who's online and get real-time typing feedback during conversations.

**FRs covered:** FR54, FR55, FR56, FR57

### Story 7.1: Track User Presence via Heartbeat

As the system,
I want to track user presence using heartbeat mechanism,
So that online status is accurate.

**Acceptance Criteria:**

**Given** a user is connected via WebSocket
**When** heartbeat is received every 30 seconds
**Then** User presence TTL is refreshed in Redis
**And** User is marked online
**And** If no heartbeat for 60 seconds, user is marked offline
**And** PresenceChangedEvent is published on status change

---

### Story 7.2: Show Online/Offline Status

As a user,
I want to see if other users are online,
So that I know who's available to chat.

**Acceptance Criteria:**

**Given** I am viewing a user profile or conversation
**When** I check their presence status
**Then** Online/offline status is displayed
**And** Last seen timestamp shown for offline users
**And** Status updates in real-time via WebSocket
**And** Green dot indicator for online users

---

### Story 7.3: Typing Indicators

As a user,
I want to see when someone is typing,
So that I know they're composing a message.

**Acceptance Criteria:**

**Given** I am in a conversation
**When** another participant starts typing
**Then** I see "User is typing..." indicator
**And** Indicator disappears after 3 seconds of no typing
**And** Multiple users typing shows "Multiple people typing..."
**And** Typing events are sent via WebSocket

---

### Story 7.4: Connection/Disconnection Status Updates

As the system,
I want to update presence when users connect/disconnect,
So that status is immediately accurate.

**Acceptance Criteria:**

**Given** WebSocket connection events
**When** user connects
**Then** Presence is set to online immediately
**And** When user disconnects, presence is set to offline after grace period
**And** Grace period handles brief network interruptions (5 seconds)
**And** Friends are notified of status changes

---

## Epic 8: Notifications & Activity Updates

**Goal:** Users stay informed about relevant activity across the platform.

**FRs covered:** FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53

### Story 8.1: Create Notifications on Events

As the system,
I want to create notifications when relevant events occur,
So that users are informed of activity.

**Acceptance Criteria:**

**Given** a relevant event occurs (friend request, reaction, comment, etc.)
**When** the event is processed by notification service
**Then** Notification record is created for affected user(s)
**And** Notification includes type, actorId, targetId, data
**And** NotificationCreatedEvent is published for real-time delivery

---

### Story 8.2: View Notification List

As a user,
I want to view my notifications,
So that I can see activity related to me.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send GET /notifications
**Then** Paginated list of notifications is returned
**And** Sorted by createdAt (newest first)
**And** Each includes type, actor info, target info, read status
**And** Unread notifications are visually distinct

---

### Story 8.3: Unread Notification Count

As a user,
I want to see my unread notification count,
So that I know there's activity to review.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I request GET /notifications/unread-count
**Then** Count of unread notifications is returned
**And** Count updates in real-time via WebSocket
**And** Badge can be displayed in UI

---

### Story 8.4: Mark Notification as Read

As a user,
I want to mark notifications as read,
So that I can track what I've seen.

**Acceptance Criteria:**

**Given** I have unread notifications
**When** I send PUT /notifications/:id/read
**Then** Notification is marked as read
**And** ReadAt timestamp is set
**And** Unread count is decremented
**And** Only my own notifications can be marked

---

### Story 8.5: Mark All Notifications as Read

As a user,
I want to mark all notifications as read at once,
So that I can clear my notification list.

**Acceptance Criteria:**

**Given** I have multiple unread notifications
**When** I send PUT /notifications/read-all
**Then** All my unread notifications are marked as read
**And** Unread count is set to 0
**And** Success response is returned

---

### Story 8.6: Push Notifications via FCM

As a user,
I want to receive push notifications on my mobile device,
So that I'm notified even when not using the app.

**Acceptance Criteria:**

**Given** I have registered a device token
**When** a notification is created for me
**Then** Push notification is sent via FCM
**And** Push includes title, body, and data payload
**And** Push is only sent if I'm offline or app is backgrounded
**And** Failed deliveries are logged for retry

---

### Story 8.7: Notification Aggregation

As a user,
I want similar notifications grouped together,
So that I'm not overwhelmed by many individual notifications.

**Acceptance Criteria:**

**Given** multiple similar events occur quickly
**When** notifications are created
**Then** Similar notifications are aggregated
**And** "John and 5 others reacted to your post" format
**And** Aggregation window is 5 minutes
**And** Clicking aggregated notification shows individual items

---

## Epic 9: AI-Powered Assistance

**Goal:** Users get intelligent help, summaries, and personalized recommendations.

**FRs covered:** FR58, FR59, FR60, FR61, FR62, FR63, FR64, FR65

### Story 9.1: Start AI Conversation

As a user,
I want to start a conversation with the AI chatbot,
So that I can get intelligent assistance.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I send POST /ai/conversations
**Then** AI conversation session is created
**And** Session ID is returned for subsequent messages
**And** Session maintains context for the conversation

---

### Story 9.2: Send Message to AI Chatbot

As a user,
I want to send messages to the AI chatbot,
So that I can ask questions and get help.

**Acceptance Criteria:**

**Given** I have an active AI conversation
**When** I send POST /ai/conversations/:id/messages with content
**Then** Message is sent to LLM provider
**And** AI response is generated
**And** Both user message and AI response are stored
**And** Response is returned (or streamed)

---

### Story 9.3: Stream AI Response

As a user,
I want AI responses to stream in real-time,
So that I see output as it's generated.

**Acceptance Criteria:**

**Given** I send a message to AI
**When** AI generates response
**Then** Response is streamed via SSE or WebSocket
**And** First token arrives in < 1 second
**And** Tokens are delivered as generated
**And** Complete response is stored when finished

---

### Story 9.4: Feed Summarization

As a user,
I want the AI to summarize my feed,
So that I can quickly catch up on missed content.

**Acceptance Criteria:**

**Given** I have an active AI conversation
**When** I ask to summarize my feed
**Then** AI fetches my recent feed posts
**And** AI generates a concise summary
**And** Summary highlights key themes and popular posts
**And** Summary is returned/streamed

---

### Story 9.5: Conversation Summarization

As a user,
I want the AI to summarize a conversation,
So that I can catch up on long chats.

**Acceptance Criteria:**

**Given** I have an active AI conversation
**When** I ask to summarize a specific chat
**Then** AI fetches recent messages from that conversation
**And** AI generates a concise summary
**And** Summary highlights key topics and action items
**And** Summary is returned/streamed

---

### Story 9.6: Content Suggestions

As a user,
I want AI suggestions for post content,
So that I can get inspiration for what to share.

**Acceptance Criteria:**

**Given** I have an active AI conversation
**When** I ask for post ideas or help writing
**Then** AI generates content suggestions
**And** Suggestions consider my posting history
**And** Multiple options provided
**And** User can refine with follow-up prompts

---

### Story 9.7: Friend and Content Recommendations

As a user,
I want AI to recommend friends or content,
So that I can discover interesting people and posts.

**Acceptance Criteria:**

**Given** I have an active AI conversation
**When** I ask for recommendations
**Then** AI analyzes my interests and activity
**And** AI suggests relevant users to follow
**And** AI suggests trending or relevant content
**And** Recommendations include reasoning
