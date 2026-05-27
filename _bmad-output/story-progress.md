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
| 2.6: User Logout | ✅ Done | - | logout endpoint |
| 2.7: RBAC Guard | ✅ Done| | |

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
| 5.3: Search post in advance with elasticsearch | ✅ Done | 2026-04-28 | Full flow: ICU/Vietnamese analyzer + synonyms, CDC sync, function_score recency, bool/should fuzzy+exact+prefix with boost 3/1/0.5, autocomplete via search_as_you_type + bool_prefix (operator='and'), highlight_query for synonym path. Production hardening: atomic alias swap (timestamp suffix + getAlias discovery + updateAliases atomic actions), optimistic concurrency via version_type=external + updatedAt.getTime(), min-char≥2 gate. Search results enriched to full PostDTOs (ES = ranking, Mongo = content, search_after cursor base64-encoded). Operational tooling: `scripts/cli/infra-reindex-posts.command.ts` for offline reindex via nest-commander. Pipeline B (completion suggester) and Technique #4 (hybrid vector) explicitly out of scope. |

> Note: Real-time feed delivery (WebSocket push + Fan-out on new post) moved to Epic 8 — shares WebSocket gateway + push infra with notifications.

**Tech applied:** CQRS (MongoDB read model), MongoDB (cursor pagination), Elasticsearch (Vietnamese analyzer, bool query, highlighting), Kafka (CDC sync), NestJS, TypeScript

---

## Epic 6: Real-time Messaging

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 6.1: Start Conversation | ✅ Done | 2026-05-09 | New `apps/messaging` app. ConversationEntity aggregate (DM + Group, type discriminator), Membership VO, ConversationCreatedEvent. DM uniqueness via partial unique index `uniq_dm` on `(lower_user_id, higher_user_id) WHERE type='direct'` — race-and-recover pattern catches `23505` and returns existing DM (200 vs 201). Group creator = OWNER, others = MEMBER, member cap 1024 enforced in entity. `POST /messaging/conversations` single endpoint branches on type. Specs written but Jest config still broken project-wide (pre-existing). |
| 6.2: Send Text Message | ✅ Done | 2026-05-21 | Full WS→Kafka→Mongo command pipeline. **Storage**: MessageEntity aggregate (UUIDv7 `_id`, 4-field strict props), `IClock` + `SystemClock`, `serverTs` stamped at app-service boundary, compound index `{conversationId:1, serverTs:-1, _id:-1}`. **Gateway** (`apps/realtime-gateway`, port 3006): socket.io@4 + @nestjs/platform-socket.io@10. JWT handshake middleware in `afterInit()` (handshake-stage reject, no DoS window). `@SubscribeMessage('message:send')` with class-validator DTO, builds `SendTextCommand`, stamps trusted `senderId` from JWT, publishes to Kafka `messaging.commands` partitioned by `conversationId`. **Command pipeline**: `SendTextCommand` integration event in `packages/common/integration-events/messaging/`. 3 partitions (learning scale). `commandType: 'send-text'` discriminator for future expansion. **Consumer** (`apps/messaging`): `MessagingCommandsConsumer` extends `KafkaIntegrationConsumer<SendTextCommand>`. Client-generated UUIDv7 messageId = idempotency source of truth. Mongo `_id` unique + at-least-once Kafka = exactly-once effect. On dup-key error: fetches existing row, same sender → idempotent no-op, different sender or missing → throws `MessageIdCollisionError` (UUID collision OR replay attack). `findByIdInConversation(conversationId, messageId)` added to repo contract (honors shard-key discipline). **Trust boundary**: WS DTO carries only `messageId`/`conversationId`/`content`/`clientSentAt`; `senderId` ALWAYS from JWT. `clientSentAt` diagnostics-only (cross-TZ clock unreliable); `gatewayReceivedAt` is the trusted timestamp. **Deferred to 6.4** (design locked in `project_story_6_4_back_channel_design` memory): back-channel for rejection events (Redis pub/sub `user:{userId}` with ref-counted subscribe per pod, no socket.io Redis adapter), Mongo notifications collection for offline-recoverability, DLQ topic, `KafkaIntegrationConsumer` error-classification refactor (permanent vs transient), empirical smoke test (surfaces naturally in 6.4 fan-out work). |
| 6.3: View Message History | ✅ Done | 2026-05-22 | `GET /messaging/conversations/:conversationId/messages?cursor=&limit=`. **New BC-local read model**: `messaging_users` Mongo collection (schema `MessagingUserRead` + `MessagingUserReadMongoRepository` in shared infra; own `IUserReadRepository` port + adapter in messaging) — separate from feed's `feed_users` so messaging schema evolves independently. **CDC**: `UserCdcApplicationService` + `UserCdcConsumer` subscribe to `social-chat-cdc.public.users` under group `cdc-messaging-users-group-id` (fan-out via consumer-group isolation from feed). **Query path**: `MessageMongoRepository.findPageWithSender(conversationId, limit, cursor?)` runs an aggregation pipeline `$match → $sort → $limit(N+1) → $lookup(messaging_users) → $unwind(preserveNullAndEmptyArrays:true)` — keeps message visible even if CDC hasn't projected sender yet (eventual consistency tolerated at read layer). **Cursor**: opaque base64url of `{serverTs:ISO, _id}`, compound-key `$or` comparison against index `{conversationId:1, serverTs:-1, _id:-1}` — encoded inline (no extra round trip to resolve cursor, unlike 5.2). **Shard-key discipline**: every query carries `conversationId` (no `findById(messageId)`). **Sharding caveat documented in code**: when `{conversationId:'hashed'}` shard key is enabled, `messaging_users` must remain unsharded or co-located, else `$lookup` scatters. **Query service**: `MessageQueryApplicationService.getHistory` does NotFound (conv missing) → Forbidden (not a member) → repo. **Sort**: newest-first DB; frontend reverses for chat UI scroll-up. |
| 6.4: Real-time Delivery | ✅ Done (smoke test deferred) | 2026-05-23 | **Back-channel** (`apps/realtime-gateway` + `apps/messaging`): Redis pub/sub with `user:{U}` + `conversation:{C}` channels, per-pod ref-counted SUBSCRIBE/UNSUBSCRIBE (`RedisSubscriptionManager` — channel-agnostic, dedicated subscriber connection via `client.duplicate()`). NO socket.io Redis adapter — subscribe-set IS the routing table. **Fan-out**: `MessageApplicationService._pushWsEvent` inline (awaited, not a listener — failure visible to consumer so retry/ack stays coherent); recipients see `message:created` on `conversation:{C}`. **Mid-session membership**: `ConversationMembershipListener` SADDs `user:{U}:conversations` cache → publishes `conversation:added`; gateway's `_dispatch` joins each socket to the new room + `subManager.attach`. **Durability decision (REVERSED)**: Mongo notifications collection rejected in favor of client-side timeout fallback — see `project_story_6_4_back_channel_design` memory. Recipient recovers `message:created` via history fetch (6.3); sender recovers `message:rejected` via ~30s client timeout flipping spinner to "send failed (unknown)". **Slice #3 — Permanent vs Transient Classification + DLQ**: `KafkaIntegrationConsumer` base class now does in-handler bounded retry (3× with 1s/2s/4s backoff) + DLQ via the `PermanentError(cause, dlqContext)` typed-error class, `classifyError(err)` hook (default: TypeError/ReferenceError/SyntaxError = permanent, else transient — subclass opts in known-permanent like `NotFoundException`), and `onDeadLettered(event, classification, cause, dlqContext?)` hook (SINGLE back-channel publish path for both permanent and transient-exhausted; ~5ms latency cost vs inline-before-throw). `processMessage` never throws → offset always committed → poison messages cannot stall a partition. DLQ topic naming: `<source>.dlq` (per-source); `DlqRecord<T>` schema covers original event + topic/partition/offset + retry count + error snapshot + dlqContext for ops replay. **Empirical smoke test**: deferred per user. **Failure-modes doc** (`_bmad-output/messaging-pipeline-failure-modes.md`) updated to reflect the timeout contract + DLQ pipeline. |
| 6.5: Send Images | ✅ Done | 2026-05-23 | Unified with 6.6 — see row below |
| 6.6: Send Files | ✅ Done | 2026-05-23 | **Unified attachment path.** Renamed `SendTextCommand` → `SendMessageCommand` (commandType `'send-message'`) since the wire envelope now carries either content, attachments, or both. `MessageEntity` gained `attachmentKeys: string[]` plus a composition invariant (`content` OR `attachments`, never neither). WS gateway DTO accepts `attachmentKeys?: string[]` with `@ArrayMaxSize(10)` + `@IsString({each:true})`; `content` is now `@IsOptional`, with gateway coercing `undefined` → `''` so empty messages still reach the entity for a uniform error path. Threaded through Mongo schema (default `[]`), persistence mapper, `MessageWithSenderModel`, history endpoint, and the `message:created` WS push envelope. App-service method renamed `sendText` → `sendMessage`. Asset purpose `chat-attachment` was already in the enum — no asset-side change; client orchestrates presign → R2 → reference keys, mirroring posts 4.2/4.3. Max-attachment limit (10) is a wire-layer cap, not a domain invariant. |
| 6.7: Delivery Status | ✅ Done | 2026-05-23 | **Telegram semantics, not WhatsApp.** ✓ = "server persisted," not "device received." Zero new backend code — reuses 6.2/6.4 pipeline: sender is subscribed to `conversation:{C}` as a member, receives echo of own message, client correlates UUIDv7 messageId to optimistic entry, flips SENDING → SENT (✓). **Rejected:** `lastDelivered` field, client `message:delivered` ack, batched timer, HTTP fast-path, distinct-sender range query, multi-channel fan-out. **MESSAGE_STATUS enum deleted** — purely client-side concept; server stores no status field. Read receipts (6.8) will reintroduce the watermark + `$max` + sender fan-out machinery because server has no natural signal for "read" (unlike "delivered" where Mongo persist is the signal). Lesson: negative-space design — sharpen semantics before architecting; ~6 components evaporate when "delivered = server has it" instead of "delivered = device confirmed." |
| 6.8: Read Receipts | ✅ Done | 2026-05-25 | **Slack/Messenger reader-avatar UI, NOT WhatsApp per-message ✓✓.** Per-(conversation, user) watermark in `participant_state` collection — 1 row per member per conversation, optimal floor (no further compression without losing per-user resolution). **Load-bearing op**: `findOneAndUpdate({conversationId, userId}, {$max: {lastReadMessageId, lastReadAt}, $setOnInsert: {...}}, {upsert: true, returnDocument: 'before'})`. `$max` works on UUIDv7 strings because lex order == time order. `returnDocument: 'before'` gives prev in one round-trip so caller computes `advanced` flag without race. Stale/duplicate acks (multi-device race, retry) silently absorbed. **Fan-out shape**: broadcast on `conversation:{C}` (single PUBLISH, every member's UI updates its "who-read-what" map). Targeted unicast `findDistinctSendersInRange` was designed mid-session then thrown away when user clarified the UI is reader-avatar rail not per-message ✓✓. **Transport**: HTTP fast-path `POST /internal/messaging/read-ack` skips Kafka — $max is order-independent, acks are low-stakes (lose-one-is-fine). InternalAuthGuard shared-secret in `x-internal-token` header; gateway authorizes service, body asserts subject. Native Node `fetch` (no @nestjs/axios), 5s AbortController timeout. Fire-and-forget on gateway (.catch(log), no WsResponse). **Offline recovery**: `GET /messaging/conversations/:id/participant-states` returns all N watermark rows (N ≤ 1024) — used on conversation-open or WS reconnect to bootstrap, heals dropped broadcasts. Mongo is source of truth, Redis pub/sub is fast notification layer. **Env**: `INTERNAL_SERVICE_TOKEN` on both apps (must match), `MESSAGING_API_URL` on gateway. **Smoke test deferred** like 6.4. Session lesson: broadcast vs unicast is a *product* choice; sharpen UX semantics before architecting the pipeline. |

**Tech planned:** WebSocket (real-time delivery, typing, presence), MongoDB (message history), Kafka (message events), Redis (presence, delivery state), DDD (Conversation + Message aggregates), OpenTelemetry (correlation via integration events), TypeScript

**Architecture ADR:** `_bmad-output/architecture-epic-6-messaging.md` — 4 cross-cutting decisions (aggregate boundary, store, transport, ordering) with rationale, alternatives rejected, production references, and story mapping. Read before starting any 6.x story.

---

## Epic 7: Presence & Status

| Story | Status | Date | Notes |
|-------|--------|------|-------|
| 7.1: Track Presence | ✅ DONE | 2026-05-26 | Redis HASH per-device heartbeat; Lua atomic HB/DC/LO/READ; composite deviceId:tabId; fan-out via conversation:{C} channels |
| 7.2: Online/Offline Status | ✅ DONE | 2026-05-26 | Free — _dispatch already generic; presence:changed rides existing conversation:{C} pub/sub pipe with zero new code |
| 7.3: Typing Indicators | ✅ DONE | 2026-05-26 | Stateless gateway relay — no Kafka, no DB; typing:started published directly to conversation:{C}; client-side 3s timer |
| 7.4: Connection Updates | ✅ DONE | 2026-05-26 | 5s grace period; DEL-as-claim Redis key eliminates cross-pod flicker without sticky sessions; in-memory clearTimeout on same-pod reconnect |

**Tech planned:** Redis (pub/sub + sorted sets for presence, TTL for heartbeat), WebSocket, Kafka (presence events), NestJS

**Key concepts covered:**
- Redis HASH model with timestamp-as-value for per-device presence tracking (no HEXPIRE needed)
- Lua atomic scripts — HB/DC/LO/READ operations, stale-field pruning, status recomputation
- Stateless gateway relay pattern for ephemeral events (typing) — skip Kafka when no durability needed
- Grace period with DEL-as-claim atomic cancellation across pods — eliminates cross-pod flicker

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
| Epic 5: Feed | 3 | 3 | 100% |
| Epic 6: Messaging | 12 | 5 | 42% |
| Epic 7: Presence | 4 | 0 | 0% |
| Epic 8: Notifications(skip)| 9 | 0 | 0% |
| Epic 9: AI | 7 | 0 | 0% |
| **TOTAL** | **65** | **37** | **57%** |

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
- ✅ Story 4.8 (Comment on Post) — done 2026-05-06. `CommentDeletedIntegrationEvent { commentSnapshot }` published via `CommentDeletedListener` (1:1 translation, no cascade); `CommentDeletedCleanupConsumer` migrated to `KafkaIntegrationConsumer`.

**Foundation for future stories:**
- Epic 6 (Messaging 6.1–6.12) — pattern rule (listener vs direct-publish) generalizes to message flows
- Epic 8 (Notifications 8.1–8.9) — integration events + correlation critical for cross-service fan-out
- Story 9.3 (Stream AI Response) — distributed tracing across AI pipeline

**Status:** Refactor complete. Both post (direct-publish, cascade) and comment (listener, 1:1) flows now on snapshot-based integration events. Pattern is established for Epic 6+.

---

## Technology Progression & Story Mapping

Bidirectional view: tech goals from `CLAUDE.md` ↔ the stories that build them.

| Technology | Goal Level | Current Level | Stories That Exercised It | Stories Still Needed |
|---|---|---|---|---|
| **NestJS** | Advanced | Intermediate+ | 1.1–5.3 (modules, providers, guards, interceptors, pipes, scheduled tasks, custom decorators, multi-app monorepo) | 6.x (WebSocket gateways), 8.x (custom logger + interceptors via integration event refactor) |
| **TypeScript** | Expert | Intermediate+ | All stories (generics in repos, discriminated unions in domain events, strict null, mapped types in DTOs) | 6.x (advanced generics for message routing), 9.x (conditional types for AI streams) |
| **PostgreSQL** | Advanced | Advanced | 3.3 (joins + pagination), 3.7 (CTEs, recursive aggregates), 4.x (transactions, soft-delete patterns) | More advanced: partitioning, triggers, explain analyze on feed queries |
| **MongoDB** | Intermediate | Intermediate | 1.5 (read model via CDC), 4.8–4.9 (comment read model), 5.1–5.2 (feed + cursor pagination) | 6.x (message history schemas, sharding considerations), 8.x (notification store) |
| **Kafka** | Intermediate | Intermediate+ | 1.3 (producer), 1.5 (Debezium CDC), 4.6 (domain events), 4.8 (CDC for comments), 5.3 (CDC to ES), 6.2 (partitioning by conversationId for ordering), **6.4 (consumer error classification + bounded transient retry + DLQ routing — `KafkaIntegrationConsumer` does in-handler retry-and-DLQ pattern, since kafkajs has no built-in DLQ like Spring Kafka)** | 8.9 (fan-out topic design), KIP-1078-style retry topics if non-blocking retry becomes needed |
| **Redis** | Advanced | Intermediate | 3.7 (caching + TTL), **6.4 (pub/sub with per-channel sharding `user:{U}` + `conversation:{C}`, ref-counted per-pod SUBSCRIBE/UNSUBSCRIBE via dedicated subscriber connection, SADD per-user conversation cache for connect-time hydration)** | 7.x (sorted sets for presence + TTL heartbeat), 8.3 (counters), 8.x (rate limiting for push) |
| **Elasticsearch** | Basic | Intermediate | 5.3 — analyzer (ICU + Vietnamese synonyms), bool/should ranking (boost as BM25 multiplier), function_score recency, search_as_you_type + bool_prefix, highlight_query, atomic alias swap with `updateAliases`, optimistic concurrency `version_type=external` | Possible future: completion suggester (Pipeline B), hybrid BM25+vector (Technique #4) — both explicitly skipped this round |
| **WebSocket** | Advanced | Advanced | 6.2 (gateway scaffold + JWT handshake middleware + `message:send` over Kafka command pipeline; 7-layer deep-dive completed), **6.4 (cross-pod fan-out via Redis pub/sub WITHOUT socket.io Redis adapter — subscribe-set IS the routing table; mid-session room join via fetchSockets when membership changes; client-timeout-as-durability contract for sender rejection)** | 7.1–7.4 (presence), 8.8 (feed push) |
| **WebRTC** | Basic | None | — | Future (likely Epic 6 extension — voice/video) |
| **gRPC** | Basic | None | — | 9.x (AI service comms) |
| **GraphQL** | Intermediate | Basic | — | Possibly 9.7 (flexible recommendations), alternative query API for feed |
| **DDD** | Solid | Solid | 1.1–1.4, 3.1–3.7 (FriendshipEntity, invariants), 4.1–4.10 (PostEntity, CommentEntity, ReactionEntity aggregates), 6.1–6.6 (ConversationEntity DM-vs-group discriminator + race-and-recover, MessageEntity UUIDv7 identity + content-OR-attachments composition invariant, sibling aggregates referenced by id only) | 6.7+ (delivery status as separate aggregate vs message-state-field), Event Sourcing candidates |
| **CQRS** | Applied | Applied | 1.5 (Debezium CDC pipeline), 4.8–4.9 (comment CDC), 5.1–5.2 (feed query side) | 8.x (notification read model), refine in Epic 6 with typed queries |
| **Event Sourcing** | Basic | None | — | Candidate for 6.x Conversation aggregate (rebuild message state from events), or 8.x notification aggregation |
| **OpenTelemetry** | Basic | In flight (homegrown) | Integration event refactor (in progress — AsyncLocalStorage-based RequestContext as pre-OTel learning) | Full OTel adoption after homegrown lesson: traces across HTTP + Kafka + gRPC |

### Reading the table
- **Current level** is conservative — marked "Advanced" only when the story pushed non-trivial patterns (CTEs, aggregates, invariants), not just CRUD.
- **Stories Still Needed** shows what gaps remain to hit the goal level. Informs story prioritization when goals matter more than features.
- Integration event refactor (in-flight) touches NestJS (EventEmitter, custom logger), Kafka (envelope design), OpenTelemetry (homegrown correlation) — spans three techs simultaneously.

---
