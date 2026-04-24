# Story Implementation Progress

Track your learning progress through all stories.

---

## Epic 1: DDD Foundation & Architecture Patterns

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 1.1: Core Domain Base Classes | ✅ Done | - | Entity, AggregateRoot, ValueObject exist |
| 1.2: Domain Event Infrastructure | ✅ Done | - | DomainEvent, IEventPublisher exist |
| 1.3: Kafka Event Publisher | ✅ Done | 2026-03-07 | Full Kafka infra: KafkaProducerService, KafkaBaseConsumer, MessagingModule, aggregateId in DomainEvent, event publisher adapters per service |
| 1.4: Refactor User Entity | ✅ Done | - | Factory methods, events |
| 1.5: CQRS Infrastructure | ✅ Done | 2026-04-04 | Full CQRS: Debezium CDC (PostgreSQL→Kafka→MongoDB), BaseKafkaConsumer hierarchy, CdcBaseConsumer, command/query service split |

**Tech applied:** DDD, CQRS, NestJS, TypeScript, Kafka, PostgreSQL, MongoDB

---

## Epic 2: User Identity & Profile Management

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 2.1: OAuth2/OIDC Auth Flow | ✅ Done | - | login, callback |
| 2.2: JWT Token Validation | ✅ Done | - | JwtGuard |
| 2.3: User Profile Creation | ✅ Done | - | Auto in callback |
| 2.4: Update User Profile | ✅ Done | - | PATCH /users/profile (autonomous mode) |
| 2.5: Upload Profile Picture | ✅ Done | 2026-03-17 | Complete: presign upload, R2 storage, Kafka events, imgproxy resizing, Coconut video transcoding, user integration |
| 2.7: User Logout | ✅ Done | - | logout endpoint |
| 2.8: RBAC Guard | ✅ Done| | |

**Tech applied:** NestJS (Guards, JWT, OAuth2/OIDC), PostgreSQL, Kafka (asset events in 2.5), TypeScript

---

## Epic 3: Social Network Building

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 3.1: Send Friend Request | ✅ Done | 2026-03-22 | FriendRequestEntity aggregate, POST /friends/request, domain event, duplicate/self-request validation |
| 3.2: Accept/Decline Friend Request | ✅ Done | 2026-03-25 | PUT /friends/request/:id, accept/decline domain methods with authorization check |
| 3.3: View Friends List | ✅ Done | 2026-03-25 | GET /friends with pagination (page/limit/sortBy), query builder join to user table, PaginatedResult |
| 3.4: Unfriend User | ✅ Done | 2026-03-25 | DELETE /friends/:userId (204), FriendshipEntity.remove() invariant, symmetric row deletion, FriendRemovedEvent |
| 3.5: Block User | ✅ Done | 2026-03-25 | POST /friends/:userId/block, FRIENDSHIP_TYPE enum (FRIEND/BLOCKED/BLOCKED_BY), upsert converts FRIEND→BLOCKED, auto-declines pending requests, UserBlockedEvent |
| 3.6: Unblock User | ✅ Done | 2026-03-28 | DELETE /friends/:userId/block (204), domain unblock() invariant, symmetric row deletion, UserUnblockedEvent |
| 3.7: Friend Suggestions | ✅ Done | 2026-03-29 | GET /friends/suggestions, Adamic-Adar (SQL CTE + 1/ln(degree)) + Jaccard (interest overlap), sigmoid normalization (k=1, x₀=2), combined 0.7 AA + 0.3 Jaccard, @nestjs/schedule cron 1hr pre-compute, Redis cache (TTL 3700s), interests field added to User entity/model/API |

**Tech applied:** DDD, PostgreSQL (aggregates, CTEs, recursive joins, pagination), Redis (caching + TTL), NestJS (scheduled tasks), Kafka (friend events), TypeScript

---

## Epic 4: Content Creation & Engagement

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 4.1: Create Text Post | ✅ Done | 2026-03-29 | PostEntity aggregate, POST /feeds/posts, domain events, full CRUD |
| 4.2: Attach Images | ✅ Done | 2026-03-29 | Client-side orchestration: asset presign → upload → inject attachmentKeys into post |
| 4.3: Attach Videos | ✅ Done | 2026-03-29 | Same flow as images, multipart upload for large files, HLS streaming |
| 4.4: Post Visibility | ✅ Done | 2026-03-29 | POST_VISIBILITY enum (PUBLIC/FRIENDS/PRIVATE), updateVisibility() |
| 4.5: View Post Details | ✅ Done | 2026-03-29 | GET /feeds/posts/:id |
| 4.6: Delete Post | ✅ Done | 2026-03-29 | Soft-delete via PostEntity.delete(), PostDeletedEvent |
| 4.7: React to Post | ✅ Done implement | 2026-03-31 | ReactionEntity aggregate root, upsert POST/DELETE/GET /feeds/posts/:postId/reactions, domain events (PostReactedEvent, PostUnreactedEvent, ReactionChangedEvent) |
| 4.8: Comment on Post | ✅ Done | 2026-04-09 | CommentEntity aggregate root, threaded comments (parentCommentId), CRUD endpoints, CDC consumer for read model, attachments support, optional content validation |
| 4.9: View Comments | ✅ Done | 2026-04-09 | GET comments + GET replies endpoints, MongoDB read model via CDC |
| 4.10: Share Post | ✅ Done | 2026-04-11 | |

**Tech applied:** DDD (PostEntity, CommentEntity, ReactionEntity aggregates + domain events), CQRS (CDC read-model for comments), PostgreSQL, MongoDB, Kafka, NestJS, TypeScript

---

## Epic 5: Personalized Feed & Discovery

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 5.1: View Home Feed | ✅ Done | 2026-04-04 | GET /feeds/posts reads from MongoDB read model via FeedQueryApplicationService, CQRS query side complete |
| 5.2: Feed Pagination | ✅ Done | 2026-04-11 | Cursor-based pagination for feed AND comments/replies: compound-key `(createdAt, _id)` comparison via `$or`, limit+1 hasMore trick, CursorPaginatedResult envelope. Backend: findFeedWithCursor / findByPostIdWithCursor / findRepliesWithCursor. Frontend: useInfiniteFeed + useInfiniteComments consume `{items, nextCursor, hasMore}`, cache patchers updated for envelope shape |
| 5.3: Search post in advance with elasticsearch | 🔧 In Progress | 2026-04-12 | Full flow implemented: Vietnamese analyzer, multi-field (vi+en), CDC sync, bool query with filters+highlighting, generic BaseElasticsearchService. Pending runtime testing. |

> Note: Real-time feed delivery (WebSocket push + Fan-out on new post) moved to Epic 8 — shares WebSocket gateway + push infra with notifications.

**Tech applied:** CQRS (MongoDB read model), MongoDB (cursor pagination), Elasticsearch (Vietnamese analyzer, bool query, highlighting), Kafka (CDC sync), NestJS, TypeScript

---

## Epic 6: Real-time Messaging

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 6.1: Start Conversation | ⬜ TODO | | |
| 6.2: Send Text Message | ⬜ TODO | | |
| 6.3: View Message History | ⬜ TODO | | |
| 6.4: Real-time Delivery | ⬜ TODO | | |
| 6.5: Send Images | ⬜ TODO | | |
| 6.6: Send Files | ⬜ TODO | | |
| 6.7: Delivery Status | ⬜ TODO | | |
| 6.8: Read Receipts | ⬜ TODO | | |
| 6.9: Conversations List | ⬜ TODO | | |
| 6.10: Create Group | ⬜ TODO | | |
| 6.11: Add Group Members | ⬜ TODO | | |
| 6.12: Leave Group | ⬜ TODO | | |

**Tech planned:** WebSocket (real-time delivery, typing, presence), MongoDB (message history), Kafka (message events), Redis (presence, delivery state), DDD (Conversation + Message aggregates), OpenTelemetry (correlation via integration events), TypeScript

---

## Epic 7: Presence & Status

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 7.1: Track Presence | ⬜ TODO | | |
| 7.2: Online/Offline Status | ⬜ TODO | | |
| 7.3: Typing Indicators | ⬜ TODO | | |
| 7.4: Connection Updates | ⬜ TODO | | |

**Tech planned:** Redis (pub/sub + sorted sets for presence, TTL for heartbeat), WebSocket, Kafka (presence events), NestJS

---

## Epic 8: Notifications

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 8.1: Create Notifications | ⬜ TODO | | |
| 8.2: View Notification List | ⬜ TODO | | |
| 8.3: Unread Count | ⬜ TODO | | |
| 8.4: Mark as Read | ⬜ TODO | | |
| 8.5: Mark All Read | ⬜ TODO | | |
| 8.6: Push Notifications | ⬜ TODO | | |
| 8.7: Aggregation | ⬜ TODO | | |
| 8.8: Real-time Feed Updates via WebSocket | ⬜ TODO | | Moved from Epic 5.3 — WebSocket push of new posts to connected friends |
| 8.9: Feed Fan-out on New Post | ⬜ TODO | | Moved from Epic 5.4 — fan-out to friends' feed caches in <1s via Kafka |

**Tech planned:** Kafka (fan-out), WebSocket (real-time push), Redis (notification counters + feed caches), MongoDB (notification store), OpenTelemetry (trace fan-out across services)

---

## Epic 9: AI Assistance

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 9.1: Start AI Conversation | ⬜ TODO | | |
| 9.2: Send Message to AI | ⬜ TODO | | |
| 9.3: Stream AI Response | ⬜ TODO | | |
| 9.4: Feed Summarization | ⬜ TODO | | |
| 9.5: Chat Summarization | ⬜ TODO | | |
| 9.6: Content Suggestions | ⬜ TODO | | |
| 9.7: Recommendations | ⬜ TODO | | |

**Tech planned:** gRPC (AI service), Server-Sent Events / streaming, Kafka (AI event pipeline), OpenTelemetry (distributed tracing across AI hops), GraphQL (possibly for flexible recommendation queries), NestJS

---

## Progress Summary

| Epic | Total | Done | Progress |
|------|-------|------|----------|
| Epic 1: DDD Foundation | 5 | 5 | 100% |
| Epic 2: User Identity | 8 | 7 | 88% |
| Epic 3: Social Network | 7 | 7 | 100% |
| Epic 4: Content | 11 | 10 | 91% |
| Epic 5: Feed | 3 | 2 | 67% (5.3 in progress) |
| Epic 6: Messaging | 12 | 0 | 0% |
| Epic 7: Presence | 4 | 0 | 0% |
| Epic 8: Notifications | 9 | 0 | 0% |
| Epic 9: AI | 7 | 0 | 0% |
| **TOTAL** | **65** | **31** | **48%** |

---

## In-Flight Refactors & Learning Goals

### Integration Event Refactor (started 2026-04-15, post flow completed 2026-04-22)

Splits in-process **domain events** (EventEmitter2) from cross-service **integration events** (Kafka). Triggered by post-delete cascade bug that exposed architectural smell (`attachmentKeys` on a domain event, coupling domain to consumer needs).

**Concepts learned (post flow):**

| Concept | What it taught | Status |
|---|---|---|
| Domain event vs integration event separation | Bounded-context boundaries; what's public API vs internal signal | ✅ 2026-04-21 |
| `@nestjs/event-emitter` + `@OnEvent()` translator pattern | In-process pub/sub; translator as anti-corruption layer | ✅ 2026-04-21 |
| `DomainEventBus` port + `EventEmitterBusAdapter` | Ports & adapters for eventing; keeps domain layer framework-independent | ✅ 2026-04-21 |
| Integration event base class (flat JSON, no `aggregateId`/`eventName`) | Public contract design; what leaks a domain concept across boundaries | ✅ 2026-04-21 |
| Topic name as `static readonly TOPIC` on event class | Co-locating config with the class that defines the contract | ✅ 2026-04-21 |
| Kafka consumer group semantics (N handlers = N groups) | Diagnosed empty-partition bug from shared group IDs | ✅ 2026-04-15 |
| Aggregate boundaries optimize for invariants + contention, not cascade convenience | Rejected folding Comment into Post; cross-aggregate coordination belongs in app service / saga | ✅ 2026-04-22 |
| Snapshot as domain-event payload (vs entity reference) | Immutability, serializability, no ORM/method leakage across boundaries | ✅ 2026-04-22 |
| Listener pattern vs direct-publish-from-app-service | Rule: listener for 1:1 translation; app service direct for cross-aggregate composition | ✅ 2026-04-22 |
| `KafkaIntegrationConsumer<T>` parallel to `KafkaBaseConsumer` | Different envelope shapes warrant separate base classes | ✅ 2026-04-22 |
| `RequestContext` / OpenTelemetry correlation | Deferred to future OTel session; `ClsModule` already wired in feed | ⏸ deferred |

**Applied retroactively:**
- ✅ Story 4.6 (Delete Post) — post-delete → asset cleanup cascade now uses `PostDeletedIntegrationEvent { postSnapshot, cascadedCommentSnapshots }` published directly from `PostApplicationService`.
- ⏳ Story 4.8 (Comment on Post) — same `CommentDeletedEvent` pattern; migration is the remaining follow-up.

**Foundation for future stories:**
- Epic 6 (Messaging 6.1–6.12) — pattern rule (listener vs direct-publish) generalizes to message flows
- Epic 8 (Notifications 8.1–8.9) — integration events + correlation critical for cross-service fan-out
- Story 9.3 (Stream AI Response) — distributed tracing across AI pipeline

**Next concrete step:** Migrate `CommentDeletedEvent` flow:
1. Add `CommentDeletedIntegrationEvent` in `packages/common/integration-events/feed/` with `commentSnapshot` payload.
2. Decide: direct publish (consistency) vs listener (1:1 — comment delete has no cascade).
3. Switch `CommentDeletedCleanupConsumer` to `KafkaIntegrationConsumer` + new topic; retire legacy `comment.comment.deleted` subscription.

---

## Technology Progression & Story Mapping

Bidirectional view: tech goals from `CLAUDE.md` ↔ the stories that build them.

| Technology | Goal Level | Current Level | Stories That Exercised It | Stories Still Needed |
|---|---|---|---|---|
| **NestJS** | Advanced | Intermediate+ | 1.1–5.3 (modules, providers, guards, interceptors, pipes, scheduled tasks, custom decorators, multi-app monorepo) | 6.x (WebSocket gateways), 8.x (custom logger + interceptors via integration event refactor) |
| **TypeScript** | Expert | Intermediate+ | All stories (generics in repos, discriminated unions in domain events, strict null, mapped types in DTOs) | 6.x (advanced generics for message routing), 9.x (conditional types for AI streams) |
| **PostgreSQL** | Advanced | Advanced | 3.3 (joins + pagination), 3.7 (CTEs, recursive aggregates), 4.x (transactions, soft-delete patterns) | More advanced: partitioning, triggers, explain analyze on feed queries |
| **MongoDB** | Intermediate | Intermediate | 1.5 (read model via CDC), 4.8–4.9 (comment read model), 5.1–5.2 (feed + cursor pagination) | 6.x (message history schemas, sharding considerations), 8.x (notification store) |
| **Kafka** | Intermediate | Intermediate | 1.3 (producer), 1.5 (Debezium CDC), 4.6 (domain events), 4.8 (CDC for comments), 5.3 (CDC to ES), today's consumer group lesson | 6.x (partitioning by conversationId for ordering), 8.9 (fan-out topic design), integration event refactor |
| **Redis** | Advanced | Basic+ | 3.7 (caching + TTL) | 7.x (pub/sub + sorted sets for presence), 8.3 (counters), 8.x (rate limiting for push) |
| **Elasticsearch** | Basic | Basic (in progress) | 5.3 (Vietnamese analyzer, multi-field, bool query, highlighting) | 5.3 completion (end-to-end search verification) |
| **WebSocket** | Advanced | Basic | — | 6.4 (real-time message delivery), 7.1–7.4 (presence), 8.8 (feed push) |
| **WebRTC** | Basic | None | — | Future (likely Epic 6 extension — voice/video) |
| **gRPC** | Basic | None | — | 9.x (AI service comms) |
| **GraphQL** | Intermediate | Basic | — | Possibly 9.7 (flexible recommendations), alternative query API for feed |
| **DDD** | Solid | Solid | 1.1–1.4, 3.1–3.7 (FriendshipEntity, invariants), 4.1–4.10 (PostEntity, CommentEntity, ReactionEntity aggregates) | 6.x (Conversation + Message aggregates — hardest DDD yet, ordering + deliverability invariants) |
| **CQRS** | Applied | Applied | 1.5 (Debezium CDC pipeline), 4.8–4.9 (comment CDC), 5.1–5.2 (feed query side) | 8.x (notification read model), refine in Epic 6 with typed queries |
| **Event Sourcing** | Basic | None | — | Candidate for 6.x Conversation aggregate (rebuild message state from events), or 8.x notification aggregation |
| **OpenTelemetry** | Basic | In flight (homegrown) | Integration event refactor (in progress — AsyncLocalStorage-based RequestContext as pre-OTel learning) | Full OTel adoption after homegrown lesson: traces across HTTP + Kafka + gRPC |

### Reading the table
- **Current level** is conservative — marked "Advanced" only when the story pushed non-trivial patterns (CTEs, aggregates, invariants), not just CRUD.
- **Stories Still Needed** shows what gaps remain to hit the goal level. Informs story prioritization when goals matter more than features.
- Integration event refactor (in-flight) touches NestJS (EventEmitter, custom logger), Kafka (envelope design), OpenTelemetry (homegrown correlation) — spans three techs simultaneously.

---
