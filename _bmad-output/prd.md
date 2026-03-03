---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
lastStep: 11
completedAt: '2026-01-10'
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2026-01-10.md'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
lastStep: 0
project_name: 'sproux-service'
user_name: 'You'
date: '2026-01-10'
---

# Product Requirements Document - sproux-service

**Author:** You
**Date:** 2026-01-10

## Executive Summary

**sproux-service** is a social media backend platform designed as a comprehensive learning environment for mastering enterprise-grade backend engineering. The project serves as a hands-on laboratory for practicing scalable architecture patterns, modern technologies, and production-ready system design.

### Vision

Build a fully-functional social media backend that could theoretically serve millions of users, while learning:
- **Breadth**: Multiple databases (PostgreSQL, MongoDB, Cassandra, Redis, Elasticsearch), messaging (Kafka), APIs (GraphQL, gRPC, REST), and real-time systems (WebSocket, SSE, WebRTC)
- **Depth**: Domain-Driven Design, CQRS, Event Sourcing, and Saga patterns
- **Production-Ready**: Observability (OpenTelemetry, ELK, Jaeger), enterprise auth (OAuth2/OIDC), and scalable architecture
- **Full-Stack Backend**: From API gateway to database layer, covering the entire backend system

### Problem Statement

Learning scalable backend architecture from tutorials and documentation is insufficient. Real understanding comes from building a complex system that naturally requires these technologies - not artificially forcing them into simple problems.

### Target Users

The primary user is the developer (you) who will learn by building. The secondary users are the hypothetical social media users whose needs drive API and architectural decisions.

### What Makes This Special

This is not just another social media API. It's a deliberately complex backend system designed to:
1. Force real-world technology decisions (e.g., hybrid fan-out for feeds)
2. Require genuine scalability patterns (e.g., < 1 second real-time delivery)
3. Practice enterprise patterns in a meaningful context (e.g., DDD bounded contexts)
4. Build production-grade observability from day one

## Project Classification

| Aspect | Value |
|--------|-------|
| **Technical Type** | api_backend (Backend services platform) |
| **Domain** | Social/Consumer (general) |
| **Complexity** | Medium (learning project, no regulatory requirements) |
| **Project Context** | Greenfield - new project |
| **Architecture Style** | Microservices with DDD, CQRS, Event Sourcing |

## Success Criteria

### User Success (Developer Learning Outcomes)

By completing this project, success means:

1. **Built & Shipped**: Implemented working features using each core technology
2. **Deep Understanding**: Can explain trade-offs and when to use each pattern
3. **Interview Ready**: Confident discussing scalable system design
4. **Portfolio Piece**: Demonstrable project showcasing enterprise-grade skills

**Ultimate Success Statement:** "I can design and build scalable backend systems"

### Technical Success

| Metric | Target | Validation |
|--------|--------|------------|
| Feed delivery | < 1 second | Real-time push to connected clients |
| Concurrent connections | 1,000+ | WebSocket load testing |
| Message throughput | 1,000+ msg/sec | Kafka consumer benchmarks |
| Search latency | < 200ms | Elasticsearch query profiling |
| API response time | < 100ms (p95) | Response time monitoring |
| Test coverage | 80%+ | Unit + Integration tests |
| Zero downtime deploy | Yes | Blue-green or rolling deployments |

### Learning Success Metrics

| Technology | Success Indicator |
|------------|-------------------|
| Kafka | Implement fan-out, understand partitioning, consumer groups |
| Redis | Use for caching, pub/sub, presence, sorted sets |
| PostgreSQL | Design proper schemas, use with DDD aggregates |
| MongoDB | Store messages, understand document modeling |
| Cassandra | Implement feed storage, understand write patterns |
| Elasticsearch | Full-text search, trending algorithms |
| WebSocket/SSE | Real-time delivery, presence system |
| WebRTC | Video call signaling |
| gRPC | Inter-service communication |
| GraphQL | API gateway implementation |
| DDD | Bounded contexts, aggregates, value objects |
| CQRS | Separate read/write models for feed |
| Event Sourcing | Reactions, audit trail |
| OpenTelemetry | Distributed tracing across services |
| ELK | Centralized logging and debugging |

## Product Scope

### MVP - Must Complete (Phase 1-3)

**Phase 1: Core Foundation**
- Auth service (OAuth2/OIDC with RBAC)
- Post service (create, media upload)
- Feed service (hybrid fan-out, < 1s delivery)
- Friends service (symmetric relationships)

**Phase 2: Communication**
- Messaging service (1-on-1, group chats)
- Notification service (in-app, push)
- Presence service (online/offline, typing)

**Phase 3: Scale & Search**
- Search service (Elasticsearch)
- Hashtag & Trending service
- Cassandra integration for feeds

### Growth Features (Phase 4-6)

**Phase 4: Advanced Features**
- Stories service (24h ephemeral content)
- Groups service (invite, request to join)
- Video calls (WebRTC signaling)

**Phase 5: Observability**
- OpenTelemetry integration
- ELK stack for logging
- Jaeger for tracing
- Prometheus + Grafana for metrics

**Phase 6: API Polish**
- GraphQL gateway
- gRPC optimization
- Performance tuning

### Vision (Future - Optional)

- Mobile app integration
- ML-based recommendations
- Content moderation
- Analytics dashboard

## User Journeys

### Journey 1: New User Onboarding - "Alex Joins the Platform"

Alex hears about the platform from a friend and decides to sign up. He opens the app and clicks "Sign Up with Google." The system redirects him to Keycloak for OAuth2 authentication. After granting permissions, he's redirected back with an auth code, which the backend exchanges for tokens.

On first login, the system detects Alex is new and prompts him to complete his profile. He uploads a profile picture, sets his display name, and adds a short bio. The backend creates his user record, stores the avatar in MinIO, and indexes his profile in Elasticsearch for discoverability.

The system then suggests friends based on his email contacts (with permission). Alex finds 3 friends already on the platform and sends friend requests. Each request triggers a Kafka event, creating notifications for the recipients.

**APIs Revealed:**
- `POST /auth/callback` - OAuth2 code exchange
- `GET /auth/me` - Get current user info
- `PUT /users/profile` - Update profile
- `POST /assets/upload` - Upload avatar
- `GET /users/suggestions` - Friend suggestions
- `POST /friends/request` - Send friend request

---

### Journey 2: Creating & Sharing a Post - "Maria Shares Her Day"

Maria had an amazing hiking trip and wants to share it. She opens the app, taps "Create Post," writes a caption, and selects 5 photos from her gallery. The client uploads each photo to the backend, which stores them in MinIO and creates thumbnails.

She selects "Friends Only" as her audience and hits "Post." The backend creates the post record, extracts hashtags (#hiking #nature), and triggers the fan-out process via Kafka. For Maria's 500 friends, the system uses write-based fan-out, pushing the post to each friend's feed in Redis.

Within 800ms, all connected friends receive a WebSocket push notification. Tom, who's online, sees Maria's post appear at the top of his feed instantly. He reacts with a ❤️, which triggers another Kafka event, incrementing the reaction count and notifying Maria.

**APIs Revealed:**
- `POST /posts` - Create post with media
- `POST /assets/upload` - Upload images (batch)
- `GET /feed` - Get personalized feed
- `POST /posts/:id/reactions` - Add reaction
- `WebSocket /ws/feed` - Real-time feed updates

---

### Journey 3: Real-time Chat - "David & Sarah Catch Up"

David sees Sarah is online (green dot) and opens a chat with her. The presence system, powered by Redis TTL, shows her status. David types "Hey! How was your trip?" - Sarah sees "David is typing..." appear in real-time via Redis Pub/Sub.

David sends the message. The backend stores it in MongoDB, publishes to Kafka for delivery guarantees, and pushes via WebSocket to Sarah. She receives it instantly with a single ✓. When she opens the chat, the message shows ✓✓ (read).

Sarah replies with a photo from her trip. The image uploads to MinIO, and the message with media URL is delivered. David wants to call Sarah - he taps "Video Call." The backend generates WebRTC signaling data, and they connect peer-to-peer for a video chat.

**APIs Revealed:**
- `GET /conversations` - List conversations
- `GET /conversations/:id/messages` - Get message history
- `POST /conversations/:id/messages` - Send message
- `PUT /messages/:id/read` - Mark as read
- `WebSocket /ws/chat` - Real-time messaging
- `WebSocket /ws/presence` - Online status, typing
- `POST /calls/initiate` - Start WebRTC signaling
- `GET /users/:id/presence` - Get user presence

---

### Journey 4: Discovering Content - "Emma Explores Trending Topics"

Emma is bored and opens the Explore tab. The backend queries Elasticsearch for trending hashtags, calculated using time-decay algorithm in Redis sorted sets. She sees #TechNews is trending and taps it.

The search service returns posts tagged with #TechNews, ranked by engagement and recency. Emma finds an interesting post about AI and searches for "machine learning tutorials" - Elasticsearch returns relevant posts and users.

She discovers a group called "AI Enthusiasts" with 10K members. The group appears because her search history and interests align with the group's topics.

**APIs Revealed:**
- `GET /trending` - Get trending hashtags
- `GET /trending/:hashtag/posts` - Get posts by hashtag
- `GET /search?q=...&type=posts` - Search posts
- `GET /search?q=...&type=users` - Search users
- `GET /search?q=...&type=groups` - Search groups
- `GET /discover/groups` - Suggested groups

---

### Journey 5: Group Interactions - "Jake Joins a Community"

Jake finds the "AI Enthusiasts" group and wants to join. It's a private group requiring approval. He taps "Request to Join" and optionally writes why he wants to join. The request goes to the admin queue via Kafka.

Lisa, the group admin, receives a notification. She reviews Jake's profile and approves his request. Jake gets a notification that he's now a member. He can now see the group feed, which is separate from his main feed.

Jake posts in the group about a new AI paper. Only group members see it. The fan-out is scoped to group members only, using the same Kafka-based system but with membership filtering.

**APIs Revealed:**
- `GET /groups/:id` - Get group details
- `POST /groups/:id/join-request` - Request to join
- `GET /groups/:id/requests` - Admin: list pending requests
- `PUT /groups/:id/requests/:userId` - Approve/reject
- `GET /groups/:id/feed` - Get group feed
- `POST /groups/:id/posts` - Post to group
- `GET /groups/:id/members` - List members

---

### Journey 6: Notifications & Engagement - "Chris Stays Connected"

Chris hasn't opened the app in 2 hours. During this time:
- 3 friends posted new content
- 2 people reacted to his post
- 1 friend request received
- 5 new messages in group chat

The notification service aggregates these via Kafka consumers. When Chris opens the app, he sees a badge with "11" notifications. The backend returns a paginated, categorized notification list.

Chris is now in a meeting and puts his phone away. When someone mentions him in a post, the system sends a push notification via FCM. He glances at his watch, sees the preview, and knows to check later.

**APIs Revealed:**
- `GET /notifications` - Get notification list
- `GET /notifications/unread-count` - Get badge count
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read
- `POST /users/devices` - Register push token
- Push via FCM/APNs - Background delivery

---

### Journey 7: Stories Flow - "Nina Shares Her Moment"

Nina is at a concert and wants to share a quick video. She opens Stories and records a 15-second clip. The backend uploads to MinIO, transcodes for optimal streaming, and creates a story record with 24-hour TTL in Redis.

Her friends see her story ring glowing. Tom taps to view - the backend records the view (Kafka event) and shows the video. Tom reacts with 🔥 which Nina sees as a story reply.

24 hours later, a scheduled Kafka consumer triggers cleanup: the story record is deleted, media is removed from MinIO, and view analytics are archived to PostgreSQL for Nina's insights.

**APIs Revealed:**
- `POST /stories` - Create story
- `GET /stories/feed` - Get friends' stories
- `GET /stories/:id` - View story (records view)
- `POST /stories/:id/reactions` - React to story
- `GET /stories/me/insights` - View analytics
- Background: TTL-based cleanup worker

---

### Journey 8: System Admin Operations - "Admin Dashboard"

Platform admin Sarah monitors system health via internal dashboard. She queries the observability stack:
- Jaeger for distributed traces of slow requests
- Prometheus/Grafana for real-time metrics
- ELK for error log analysis

She notices increased latency in the feed service. Tracing reveals a slow Cassandra query. She flags a user-reported post for review, and the moderation queue shows pending items.

**APIs Revealed:**
- `GET /admin/metrics` - System metrics
- `GET /admin/users` - User management
- `PUT /admin/users/:id/status` - Ban/suspend user
- `GET /admin/reports` - Content reports
- `PUT /admin/posts/:id/moderate` - Moderate content
- Integration with OpenTelemetry, Jaeger, ELK

---

## Journey Requirements Summary

| Journey | Core Services | Key Technologies |
|---------|---------------|------------------|
| Onboarding | Auth, User, Asset | Keycloak, PostgreSQL, MinIO, Elasticsearch |
| Post & Share | Post, Feed, Reaction | Kafka, Redis, PostgreSQL, WebSocket |
| Chat | Message, Presence | MongoDB, Redis Pub/Sub, WebSocket, WebRTC |
| Discover | Search, Trending | Elasticsearch, Redis Sorted Sets |
| Groups | Group, Membership | PostgreSQL, Kafka |
| Notifications | Notification | Kafka, Redis, FCM/APNs |
| Stories | Story | Redis TTL, MinIO, Kafka Workers |
| Admin | Admin, Observability | OpenTelemetry, ELK, Jaeger |

## API Backend Specific Requirements

### API Architecture Overview

**sproux-service** is a microservices-based backend platform with multiple API styles:

| API Layer | Technology | Purpose |
|-----------|------------|---------|
| Public API | GraphQL Gateway | Client-facing, flexible queries |
| Public API | REST (legacy) | Simple endpoints, webhooks |
| Internal | gRPC | Service-to-service communication |
| Real-time | WebSocket | Chat, presence, notifications |
| Real-time | SSE | Feed updates, one-way push |

### API Versioning Strategy

| Style | Approach |
|-------|----------|
| REST | URL path versioning (`/api/v1/...`) |
| GraphQL | Schema evolution with deprecation |
| gRPC | Package versioning in proto files |

### Authentication Model

| Component | Implementation |
|-----------|----------------|
| Identity Provider | Keycloak (OAuth2/OIDC) |
| Token Type | JWT access tokens |
| Token Validation | JWKS verification |
| Authorization | RBAC via JWT claims |
| Scopes | Endpoint-level permission control |

### Rate Limiting

| Scope | Limit | Implementation |
|-------|-------|----------------|
| Per-User | 1000 req/min | Redis sliding window |
| Per-Endpoint | Varies by endpoint | Configurable per route |
| Burst Protection | 100 req/sec max | Token bucket algorithm |

### Error Response Format

Standard HTTP Status Codes with JSON body including error code, message, details array, requestId, and timestamp.

Error Code Categories:
- `4xx` - Client errors (validation, auth, not found)
- `5xx` - Server errors (internal, service unavailable)

### API Documentation

| Tool | Coverage |
|------|----------|
| OpenAPI 3.0 | REST endpoints, auto-generated |
| GraphQL Introspection | Schema, types, queries |
| AsyncAPI | WebSocket events, Kafka topics |
| Swagger UI | Interactive REST documentation |
| GraphQL Playground | Interactive GraphQL explorer |

### Data Schemas

- **Request/Response Format:** JSON (REST, GraphQL)
- **Internal Format:** Protocol Buffers (gRPC)
- **Event Format:** Avro/JSON (Kafka)

### Endpoint Categories

| Category | Auth Required |
|----------|---------------|
| Auth | Partial |
| Users | Yes |
| Posts | Yes |
| Feed | Yes |
| Friends | Yes |
| Messages | Yes |
| Groups | Yes |
| Notifications | Yes |
| Search | Yes |
| Admin | Yes + Admin Role |

### Implementation Considerations

- **gRPC for Internal:** Type-safe contracts, streaming, low latency
- **GraphQL for Clients:** Flexible queries, single endpoint, subscriptions
- **REST for Simplicity:** Webhooks, third-party integrations, legacy support

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Platform MVP for Learning
**Philosophy:** Build a complete foundation that naturally requires the core scalable technologies

### MVP Definition (Phase 1-2)

**MVP = Core Social + Real-time Communication**

| Component | Features | Technologies Practiced |
|-----------|----------|------------------------|
| Auth | OAuth2/OIDC, RBAC | Keycloak, JWT, Guards |
| Posts | Create, media upload, reactions | PostgreSQL, MinIO, Kafka |
| Feed | Hybrid fan-out, < 1s delivery | Kafka, Redis, WebSocket |
| Friends | Symmetric relationships, requests | PostgreSQL, Kafka events |
| Messaging | 1-on-1, group chats | MongoDB, WebSocket |
| Notifications | In-app, push | Kafka, Redis, FCM |
| Presence | Online/offline, typing | Redis TTL, Pub/Sub |

**MVP Success Criteria:**
- All Phase 1-2 features functional
- < 1 second feed delivery
- Real-time messaging working
- 80%+ test coverage on core services

### Post-MVP Phases

**Phase 3: Scale & Search**
- User/Post Search (Elasticsearch)
- Hashtag System (Elasticsearch, Regex)
- Trending (Redis Sorted Sets, Time-decay)
- Feed Optimization (Cassandra)

**Phase 4: Advanced Features**
- Stories 24h (Redis TTL, Cron workers)
- Groups (PostgreSQL, Kafka)
- Video Calls (WebRTC, Signaling server)

**Phase 5: Observability**
- Distributed Tracing (OpenTelemetry, Jaeger)
- Metrics (Prometheus, Grafana)
- Logging (ELK Stack)
- Health Checks (K8s probes)

**Phase 6: API Polish**
- GraphQL Gateway (Apollo/NestJS GraphQL)
- gRPC Optimization (Proto optimization)
- Performance Tuning (Profiling, caching)

### Risk Mitigation

**Technical Risks:**
- Kafka complexity → Start with single partition, scale later
- WebSocket scaling → Use Redis Pub/Sub for multi-instance
- Feed performance → Benchmark early, optimize iteratively

**Learning Risks:**
- Scope creep → Strict phase boundaries
- Overwhelm → Complete one phase before next
- Shallow learning → Write tests, document decisions

## Functional Requirements

### User Account & Authentication

- FR1: Users can authenticate via OAuth2/OIDC through external identity provider (Keycloak)
- FR2: Users can view and update their profile information (name, bio, avatar)
- FR3: Users can upload profile pictures
- FR4: Users can register device tokens for push notifications
- FR5: Users can log out from the platform
- FR6: System can validate JWT tokens and extract user claims
- FR7: System can enforce role-based access control (RBAC) on protected endpoints
- FR8: System can enforce scope-based permissions on API operations

### Content Creation & Management

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

### Social Connections

- FR20: Users can send friend requests to other users
- FR21: Users can accept or decline incoming friend requests
- FR22: Users can view their list of friends
- FR23: Users can unfriend existing friends
- FR24: Users can block other users
- FR25: Users can unblock previously blocked users
- FR26: Users can view suggested friends
- FR27: System can maintain symmetric friend relationships

### Content Discovery & Feed

- FR28: Users can view their personalized home feed
- FR29: Users can receive real-time feed updates when connected
- FR30: System can fan-out new posts to friends' feeds within 1 second
- FR31: Users can pull-to-refresh their feed for new content
- FR32: Users can view older feed content via pagination/infinite scroll

### Real-time Messaging

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

### Notifications & Engagement

- FR45: Users can view their notification list
- FR46: Users can see unread notification count
- FR47: Users can mark notifications as read
- FR48: Users can mark all notifications as read
- FR49: System can send in-app notifications for friend requests
- FR50: System can send in-app notifications for new posts from friends
- FR51: System can send in-app notifications for reactions and comments
- FR52: System can send push notifications to mobile devices
- FR53: System can aggregate multiple similar notifications

### Presence & Status

- FR54: Users can see online/offline status of other users
- FR55: Users can see typing indicators when others are typing in a conversation
- FR56: System can track user presence via heartbeat mechanism
- FR57: System can update presence status when users connect/disconnect

### AI Chatbot

- FR58: Users can start a conversation with the AI chatbot
- FR59: Users can ask the AI chatbot general questions
- FR60: Users can ask the AI chatbot for help with platform features
- FR61: Users can request AI to summarize their feed or conversations
- FR62: Users can request AI suggestions for post content
- FR63: Users can request AI to recommend friends or content based on interests
- FR64: System can maintain conversation context within a chat session
- FR65: System can stream AI responses in real-time for better UX

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Feed delivery latency | < 1 second | Time from post creation to WebSocket push |
| API response time (p95) | < 100ms | Response time monitoring |
| API response time (p99) | < 500ms | Response time monitoring |
| Message delivery latency | < 200ms | End-to-end message timing |
| Search query response | < 200ms | Elasticsearch query profiling |
| WebSocket connection time | < 500ms | Connection establishment timing |
| AI response first token | < 1 second | Time to first streamed token |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | OAuth2/OIDC via Keycloak with JWT tokens |
| Token validation | JWKS verification for all protected endpoints |
| Authorization | RBAC enforced at API gateway and service level |
| Data in transit | TLS 1.3 for all external communication |
| Data at rest | Encryption for sensitive data in databases |
| API protection | Rate limiting per user and per endpoint |
| Input validation | Sanitize all user inputs to prevent injection |
| Secret management | Environment variables, no hardcoded secrets |

### Scalability

| Metric | Target | Validation |
|--------|--------|------------|
| Concurrent WebSocket connections | 1,000+ | Load testing with k6/Artillery |
| Message throughput | 1,000+ msg/sec | Kafka consumer benchmarks |
| Horizontal scaling | Stateless services | Kubernetes pod autoscaling |
| Database scaling | Read replicas support | PostgreSQL streaming replication |
| Cache hit ratio | > 80% | Redis cache monitoring |
| Feed fan-out | 1,000 friends in < 1s | Write-path benchmarks |

### Reliability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Service availability | 99.5% uptime | Health checks, auto-restart |
| Message delivery | At-least-once | Kafka with consumer acknowledgment |
| Data durability | No data loss | Database replication, backups |
| Graceful degradation | Core features survive | Circuit breakers, fallbacks |
| Zero-downtime deployment | Yes | Blue-green or rolling deployments |

### Integration

| External System | Requirements |
|-----------------|--------------|
| Keycloak | OAuth2 flows, JWKS endpoint, token refresh |
| LLM Provider (OpenAI/Claude) | Streaming API, rate limit handling, timeout management |
| Push Notifications (FCM/APNs) | Device registration, batch sending, delivery tracking |
| Object Storage (MinIO/S3) | Pre-signed URLs, multipart upload, CDN integration |

### Observability

| Component | Implementation |
|-----------|----------------|
| Distributed tracing | OpenTelemetry with Jaeger |
| Metrics collection | Prometheus with custom metrics |
| Log aggregation | ELK Stack (Elasticsearch, Logstash, Kibana) |
| Dashboards | Grafana for real-time monitoring |
| Alerting | Prometheus alertmanager |
| Health endpoints | `/health/live` and `/health/ready` per service |
