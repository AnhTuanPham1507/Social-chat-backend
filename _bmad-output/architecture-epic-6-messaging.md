---
title: 'Architecture Decisions — Epic 6: Real-time Messaging'
date: '2026-05-06'
status: accepted
supersedes:
  - architecture.md (lines 422, 1461 — high-level "sticky sessions / isConversationMember" assumptions are refined here)
related:
  - _bmad-output/architecture.md
  - _bmad-output/epics.md
  - memory/project_integration_event_refactor.md
---

# Epic 6 — Real-time Messaging Architecture

This document captures four cross-cutting architectural decisions that shape every story in Epic 6 (and partially Epic 7 + 8). It is the output of a deep-dive design session — production-realistic decisions backed by real-system references, with alternatives considered and rejected.

**Reading order**: skim the Decision Summary table, then read each section for rationale. The "Production reference" subsections show what real systems do; the "Alternatives rejected" subsections explain why we did not.

---

## Decision Summary

| # | Decision | Resolution | Production reference |
|---|---|---|---|
| 1 | Aggregate boundary | Conversation aggregate (Membership as VO collection, type discriminator). Message as **sibling aggregate**. DM uniqueness via partial unique index on sorted member pair. | Slack (idempotent IM open), WhatsApp (deterministic chat_id), Discord (channel + message split) |
| 2 | Authoritative store | MongoDB single store, **no CQRS** for the message body. Per-message documents, shard key `{ conversationId: "hashed" }`. Conversation list = separate denormalized read model, async via integration event with coalescing. | Discord (Cassandra wide-row, similar shape), Slack (sharded MySQL), WhatsApp (Mnesia → MySQL archive) |
| 3 | Transport | New `apps/realtime-gateway` app. Stateless gateway + **Redis pub/sub** for fan-out (`conv:{id}`, `user:{id}` channels). Kafka in send path for ordering + durability. | Slack Edge layer + Envoy, Pusher/Ably, WhatsApp Erlang sessions |
| 4 | Ordering | Server timestamp + monotonic tiebreaker for storage. Kafka per-conversation partition for write-path FIFO. **Clients sort by serverTs on receipt** — never trust arrival order. | All major messaging systems |

---

## Decision 1 — Aggregate Boundary

### What we decided

- **Conversation** is an aggregate root with `type: DM | GROUP` discriminator.
- **Membership** lives inside Conversation as a value object collection (`members: Member[]`).
- **Message** is a separate aggregate root, referencing Conversation by `conversationId` only.
- DM has invariant `members.length === 2` and immutable membership.
- DM uniqueness enforced by **partial unique index** on `(lower_user_id, higher_user_id) WHERE type = 'DM'`.

### Rationale

The DDD-purist instinct is "Message inside Conversation, because the aggregate enforces the per-conversation ordering invariant." We deliberately reject that because:

1. **Write contention**: 50 users in a group chatting concurrently — every send would version-bump the Conversation aggregate → optimistic locking conflicts at scale. Same problem as folding Comment into Post (rejected in Epic 4) but worse.
2. **Aggregate size**: a 5-year DM has 100K+ messages. Loading the aggregate-as-a-unit becomes impossible.
3. **Vernon's "Effective Aggregate Design"** rules support this: *favor small aggregates*, *cross-aggregate updates use eventual consistency*. We are not violating DDD; we are following the modern interpretation.

### The DDD tension we are accepting

A strict reading of Evans says invariants belong in aggregates. We split Message out anyway, which means **no aggregate enforces "messages are ordered."** We resolve this by reframing:

> *Ordering is a **read-time consistency requirement**, not a write-time business invariant.* Two messages briefly appearing out of order then re-sorting violates no business rule. The "invariant" reduces to "reads must produce a deterministic order," which storage-level ordering (server timestamp + tiebreak) satisfies perfectly.

Compare: "Order total = sum of line items" is a true invariant (correctness fails if violated). "Messages display in arrival order" is a UX/consistency requirement.

This is the same call **every production messaging system** makes. Defensible to a senior reviewer by citing Vernon Rule 2 (small aggregates) and Rule 4 (cross-aggregate eventual consistency).

### Membership inside Conversation — the cap

`Membership` as a VO collection inside Conversation works **with a member cap** (loading aggregate loads member list).

| System | Member cap | Strategy past cap |
|---|---|---|
| WhatsApp Group | 1024 | In-aggregate |
| Slack channel | ~few thousand | In-aggregate |
| Telegram Supergroup | 200,000 | Externalized to different aggregate type |
| Discord guild | 500,000 | Externalized; guild aggregate doesn't load member list |

**For sproux**: cap GroupConversation at **1024** initially. Past that we'd need a `Channel` aggregate type with paginated member lookup — out of scope for now, but documented as a known ceiling.

### DM idempotent create — production technique

Without this, two users tapping "Message" simultaneously creates two DM rows.

```sql
CREATE UNIQUE INDEX uniq_dm
  ON conversations (lower_user_id, higher_user_id)
  WHERE type = 'DM';
```

`lower_user_id`/`higher_user_id` are derived columns computed at insert from the member pair (sorted). Application service catches the constraint violation on race and returns the existing conversation. Group has no uniqueness constraint (you can have many groups with the same members).

### Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Message inside Conversation (single aggregate) | Write contention + load size. Same reasoning as Epic 4 Post/Comment. |
| `DirectConversation` and `GroupConversation` as separate aggregate types | Most invariants shared; duplication. Single aggregate with `type` discriminator is cleaner. |
| `ConversationDay` time-bucket aggregate (DDD-purist save) | Awkward in domain terms, doesn't actually solve scale problem. |
| Membership as a separate aggregate | Would require eventual consistency for "is-member-before-send" check — over-complex for sproux scale. |

---

## Decision 2 — Authoritative Store

### What we decided

- **MongoDB single store** for messages. No CQRS for the message body.
- **Per-message documents** (Variant C1, not bucketed wide rows).
- **Shard key**: `{ conversationId: "hashed" }`.
- **Indexes**: `{ conversationId: 1, serverTs: -1, _id: -1 }` (pagination), `{ _id: 1 }` (PK).
- **Conversation list** is a **separate denormalized read model** (`conversation_list_items` collection), updated **asynchronously via integration event** with coalescing.

### Rationale — why not the Epic 4 CQRS pattern

Epic 4 used Postgres + Debezium CDC → Mongo for posts. This pattern fails for messages because:

1. **Latency**: messaging needs <100ms recipient delivery. CDC lag (Postgres → Debezium → Kafka → consumer → Mongo) is 200ms-1s. Too slow.
2. **No read-shape benefit**: messaging queries are simple ("last N messages in conversation, paginated"). Postgres serves this just as well as Mongo. CQRS adds complexity for no gain.
3. **Real-time delivery bypasses the DB anyway**: messages reach recipients via Redis pub/sub, not via DB reads. DB is consulted only for backfill (offline reconnect).

The architecture inverts:

```
                    ┌─→ DB write (history, durability)
Sender sends msg ──→│
                    └─→ Pub/sub (real-time fan-out to recipient gateways)

Recipient reads:
  - Already-online: receives from pub/sub
  - Coming-online (backfill): reads from DB
```

Every major messaging system uses a single store. None uses CQRS for the message body itself.

### Rationale — Mongo over Postgres or Cassandra

| Store | Pros | Cons | Verdict |
|---|---|---|---|
| Postgres | Familiar, ACID | Doesn't scale horizontally for messaging volume; partitioning is manual | Reject |
| Cassandra | Designed for this workload (Discord uses it) | New infrastructure, steep learning curve, overkill for sproux scale | Reject |
| **Mongo** | Already in stack, sharding built-in, schema flexibility | Mongo wide-rows less optimal than Cassandra wide-rows | **Accept** |
| Hybrid (Postgres + CDC → Mongo) | Familiar pattern | CDC lag breaks real-time | Reject |

### Why per-message documents (Variant C1), not bucketed wide rows (Variant C2)

Discord uses time-bucketed wide rows in **Cassandra** because Cassandra optimizes wide rows. **Mongo does not get the same benefits** — its storage engine treats wide rows as just-larger-documents, with document-level locking on writes.

| Aspect | C1 (per-message) | C2 (bucketed wide rows) |
|---|---|---|
| Reads (last 50 msgs) | 50 docs | 1-2 docs |
| Write per message | 1 insert | 1 update (push to array) |
| **Hot conversation contention** | Low (each msg = own doc) | **HIGH** — same bucket doc updated repeatedly |
| Edit single message | Update single doc | Update sub-document in array |
| Document size limit (16MB) | Never hit | Must rollover bucket |

C2's hot-conversation write contention is unacceptable. We use C1 — Discord-inspired *in spirit* (sharded by conversationId, optimized for messaging read shape), but adapted to Mongo's strengths.

### Sharding — design today, enable tomorrow

We currently run a single Mongo replica set. Sharding is not enabled. **But shard key is a one-way decision in MongoDB** — `reshardCollection` exists (5.0+) but is expensive and risky on large data.

So we:
- Choose the shard key conceptually now (`{ conversationId: "hashed" }`)
- Make all indexes lead with `conversationId`
- Make all queries shard-targeted (always include `conversationId` in predicate)

When we outgrow one node, `sh.shardCollection()` flips the switch. Designing for sharding from day one is the production rule.

### Why hashed sharding

Ranged sharding by `conversationId` would hot-spot inserts because Mongo ObjectIds are monotonic — all new conversations land on the same shard (the "max range" shard). Hashed shard key distributes evenly.

Within a conversation, all messages still cluster on one shard (good for the access pattern: "last N messages in conversation X").

### Hot conversation toolkit (deferred — wire in when needed)

Even with hashed sharding, **one conversation = one shard**. A 10K-member viral group can saturate that shard. Mitigations to deploy when this becomes a real problem (not now):

| Technique | What it does |
|---|---|
| Time-bucket secondary key | Re-introduce time as secondary partition: `{conversationId, hour_bucket}`. Same conversation, different hour = different shard slot. Spreads write load within a hot conversation. |
| Redis hot-conversation cache | Last 50-100 messages of hot conversations live in Redis (`LPUSH` + `LTRIM`). Reads bypass DB. Slack pattern. |
| Write coalescing in Kafka consumer | Worker batches 10-50ms of inbound messages into bulk inserts. WhatsApp/Discord pattern. Real-time delivery already happened via pub/sub, so latency is invisible to user. |
| External sequence allocator | Atomic counter (Redis `INCR`) per conversation gives monotonic sequence numbers, decoupling ordering from DB write contention. |
| Read replicas with stale-read tolerance | History scrollback acceptable on replicas with 100ms lag. |

### Conversation list read model

```
Collection: conversation_list_items
Index: { userId: 1, lastMessageAt: -1 }
Shard key (eventually): { userId: "hashed" }

Document:
{
  userId,                     // recipient of this list entry
  conversationId,
  conversationType,
  conversationName,
  otherParticipants,           // for DMs
  lastMessage: { senderId, contentPreview, sentAt },
  lastMessageAt,
  unreadCount,
  isPinned,
  isMuted,
}
```

Per-user per-conversation document. Query: `find({userId}).sort({lastMessageAt: -1}).limit(20)`. Single indexed query, no N+1.

### Update mechanism — integration event, NOT CDC

Updates happen via `MessageSentIntegrationEvent` consumer, not CDC. The rule:

| Source change shape | Mechanism |
|---|---|
| 1 source → 1 derived row, simple denorm | **CDC** |
| 1 source → N derived rows with enrichment + business rules (fan-out) | **Integration event** |

`conversation_list_items` is fan-out (1 message → N member rows) with enrichment (lookup membership) and business rules (skip muted, coalesce). That's not CDC's mental model — that's a workflow.

### Write amplification mitigation for conversation_list_items

10K-member group send = 10K updates. Mitigations:

1. **Async via integration event** — message persistence completes immediately; updates lag.
2. **Coalesce within window** — 5 messages in 50ms → 1 update per (user, conversation).
3. **Skip muted recipients** — don't bump muted conversations.
4. **Lazy materialization for inactive users** — user offline 30+ days → stop fan-out; rebuild on reconnect.
5. **Push for small groups, pull for huge groups** — past some member threshold, query the conversation directly instead of materializing per-member.

For now: implement (1), (2), (3). Defer (4), (5) until needed.

### Future CDC use cases (not now)

CDC will return for:
- Message search index in Elasticsearch (1 message → 1 ES doc, no fan-out — same pattern as Epic 5.3 for posts)
- Audit log of all messages

### Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Postgres + CDC → Mongo (Epic 4 pattern) | CDC lag (200ms-1s) breaks <100ms delivery target |
| Cassandra | New infra, learning cost, overkill for sproux scale |
| Mongo bucketed wide rows (Variant C2) | Mongo doesn't optimize wide rows; document-level lock contention on hot buckets |
| CDC for conversation_list_items updates | Wrong shape — CDC is for 1:1 replication, this is fan-out with enrichment |

---

## Decision 3 — Transport / WebSocket Gateway

### What we decided

- **New app**: `apps/realtime-gateway` — dedicated WebSocket termination.
- **Architecture**: stateless gateway + **Redis pub/sub** keyed by conversation.
- **Channels**: `conv:{conversationId}` for message events; `user:{userId}` for personal events (typing, read receipts, friend requests).
- **Send path**: client → WS → gateway → Kafka (partitioned by conversationId) → message-app → Mongo persist + Redis publish.
- **Receive path**: message-app Redis publish → all pods subscribed to that channel → fan out to local sockets.
- **Reconnection**: client sends `last_known_message_id` per conversation → gateway streams missed from DB → resumes live.
- **Multi-device**: same user can have N sockets across pods; each pod with any local socket subscribes to relevant channels.
- **Auth**: JWT in WS connect (subprotocol or first message), validated against existing auth service.
- **Heartbeat**: 30s ping, 60s timeout. Drives presence (Epic 7).

### Architecture comparison

| | Pattern | Inter-pod path | Scale ceiling | Verdict |
|---|---|---|---|---|
| A | Single pod | N/A | ~50K conn / Node pod | Reject — doesn't teach scale |
| B | Sticky + per-user registry | Lookup `user:Bob → pod-B`, publish to `gateway:pod-B` | ~hundreds of K | Reject — registry churn, race conditions on reconnect-to-different-pod |
| **C** | **Stateless + per-conversation pub/sub** | Publish to `conv:X`, all pods with subscribers receive | **~hundreds of K** | **Accept** |
| D | Kafka per-conversation partition | Each pod consumes; filters locally | ~millions | Reject — Kafka ill-suited for "every pod gets every message" pattern |
| E | Sharded gateway (Discord) | Hash user_id → shard pod | ~millions | Reject — overkill for sproux |

### Why C beats B

| | C (stateless + Redis conv channels) | B (sticky + per-user registry) |
|---|---|---|
| Registry maintenance | None | Redis writes on connect/disconnect, TTL refresh, race conditions |
| Per-message hot-path lookup | None | Redis lookup "where is Bob?" |
| Fan-out for groups | Implicit (publish once, all pods receive) | Sender computes membership and routes to N pods |
| Reconnect-to-different-pod | Trivial (just subscribe channels on new pod) | Stale registry entry, race window |

### Why C beats D (Kafka pure)

Kafka isn't designed for "every consumer receives every message":

| Approach | Mechanic | Why it breaks |
|---|---|---|
| All pods in one consumer group | Kafka splits partitions across consumers; each partition → ONE pod | Recipients on other pods miss it. Need a second-hop forwarding layer — back to B's complexity plus Kafka. |
| Each pod is its own consumer group | Every pod consumes everything | At 100 pods × 1M msgs/sec = 100M consumer events. Network + CPU amplification. Per-group offset tracking. Rebalances on pod up/down. |

**Redis pub/sub is the right tool for fan-out** ("every subscriber gets every message"); **Kafka is the right tool for partitioned ordered work distribution**. We use both, each for its job.

### Why a separate `apps/realtime-gateway` (not API gateway / Kong)

WebSocket pods have fundamentally different operational profile from HTTP API pods:

- Connection-bound vs request-bound scaling
- Long-lived processes vs replaceable
- Different failure modes (don't kill 100K connections to deploy a feed change)
- Different resource limits (file descriptors, event loop, memory)

Kong (or nginx, Envoy, ALB) is a useful **edge layer upstream** of the realtime-gateway — TLS termination, JWT validation at edge, rate limiting. **Not a replacement.** Kong is a stateless proxy; the realtime-gateway holds per-user socket state.

```
Internet → CDN → Kong/nginx → apps/realtime-gateway → Redis / Kafka
                  ──────────   ────────────────────
                  edge: TLS,    stateful: sockets,
                  JWT, RL       fan-out, reconnect
```

Slack uses this exact split (Envoy in front, "Edge" servers behind). Discord uses ELB + custom gateway shards.

### Why bidirectional WS (send + receive on same socket)

Send via separate HTTP would add latency per message and require client to manage two connections. Every production chat does bidirectional WS. The send goes:

```
Client → (WS frame) → realtime-gateway → (Kafka) → message-app
```

### Why Kafka in send path (not direct HTTP gateway → message-app)

Four reasons:

1. **Per-conversation FIFO ordering** at the message-app level (Kafka partition by conversationId).
2. **Durability for retry** — if message-app crashes mid-process, Kafka retains; consumer offset tracks; on restart, picks up where left off.
3. **Latency decoupling** — gateway doesn't wait for message-app's full pipeline. Sub-ms Kafka ack frees the WS handler immediately.
4. **Backpressure** — slow message-app → Kafka buffers. With HTTP, slow downstream means gateway-side queues build up → OOM.

This turns message-app from a "synchronous critical path" into an "async durable consumer."

### The principle that resolves all race conditions

> **Live delivery is a latency optimization, never the source of truth. Backfill from DB is the source of truth.**

Once internalized, every race condition (send-during-disconnect, pod crash mid-publish, Redis dropped a message) is handled by the same mechanism: reconnect → backfill from `last_known_message_id` → catch up. Live delivery is the fast path; backfill is the correct path.

### Reconnect storm mitigation

100K clients reconnecting after a deploy is a real risk. Mitigations:

| Layer | Technique |
|---|---|
| Client (mandatory) | **Jittered exponential backoff** on reconnect. Random jitter prevents synchronized retries. |
| Infrastructure (when needed) | **Sharded Redis pub/sub** — split conv channels across multiple Redis nodes by `hash(conv_id) % N`. Redis 7+ has `SSUBSCRIBE` for Cluster mode. |

Single biggest lever is **client jitter**. 99% of thundering-herd incidents come from clients retrying at the same instant.

### Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Architecture B (sticky + per-user registry) | Registry churn, hot-path lookup cost, reconnect race conditions |
| Architecture D (Kafka per-conversation, all pods consume) | Kafka not built for fan-out semantics; per-pod consumer group overhead |
| Architecture E (sharded gateway, Discord-style) | Overkill for sproux scale |
| Kong as the realtime-gateway | Kong is stateless proxy, doesn't hold per-user socket state |
| HTTP send + WS receive | Latency overhead per send; two connections per client |
| HTTP gateway → message-app (no Kafka) | No durable retry, no backpressure, no per-conversation FIFO |

---

## Decision 4 — Ordering Mechanism

### What we decided

Multi-layer ordering enforcement:

| Layer | Mechanism | Guarantee |
|---|---|---|
| **Send path** | Kafka partition by `conversationId` | Per-conversation FIFO at the message-app processing layer |
| **Storage** | `serverTs` (server-assigned) + `messageId` (monotonic tiebreaker) | Deterministic global order on read |
| **Live delivery (one publisher)** | Redis pub/sub from message-app to a single channel | Order preserved within messages from same publisher |
| **Live delivery (cross-publisher)** | None — trust order is incorrect | **Clients must sort by `serverTs` on receipt** |

### Why ordering is enforced outside the aggregate

This is the resolution to the DDD tension from Decision 1. We could put ordering inside Conversation aggregate as `nextMessageSequence` field, but:

1. Every message send → Conversation version bump → optimistic locking conflicts at scale.
2. Aggregate-level sequence allocation introduces serialization point on the hottest path.

Production systems (WhatsApp, Discord, Slack) all use server timestamps, not aggregate-allocated sequences. We follow.

### Why server timestamps and not client timestamps

- Client clock skew (devices wrong by minutes/hours)
- Adversarial clients can lie
- Intentional manipulation ("show my message as sent yesterday")

Server-assigned `serverTs` at message-app receipt is the source of truth.

### Why a tiebreaker

Two senders sending in the same millisecond → identical `serverTs` → ordering ambiguous. Tiebreaker (`messageId` as monotonic ULID/snowflake-style) resolves this deterministically.

### Client sort behavior

**Mandatory.** Client cannot trust arrival order from Redis pub/sub when messages may come from different message-app pods or be slightly delayed. Client maintains in-memory list, inserts new messages by `(serverTs, messageId)` lexicographic position.

### Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Conversation-aggregate-issued sequence | Re-introduces aggregate write contention we split Message out to avoid |
| Database-level auto-increment | Not portable across shards; sharded DB doesn't have global sequence |
| Trust client timestamps | Clock skew, adversarial input |
| Trust arrival order on recipient | Cross-publisher ordering not guaranteed by Redis pub/sub |

---

## Cross-Cutting Principles

These apply across all four decisions and should anchor any future Epic 6 work:

1. **Live delivery is a latency optimization, never the source of truth.** Backfill is the truth.
2. **Aggregate boundaries are decided by contention/size, not by which invariants you'd "like" to enforce together.** Some invariants live outside aggregates (and that's fine — Vernon's Rule 4).
3. **CDC for state mirrors. Integration events for fan-out workflows.** Don't mix paradigms for the same source.
4. **Design for sharding from day one even when running on one node.** Shard key is a one-way decision.
5. **Each tool for its job**: Kafka for partitioned ordered processing; Redis pub/sub for fan-out; Mongo for storage; gateway for connection state.

---

## Production References Cited

| Topic | System | Pattern |
|---|---|---|
| DM uniqueness (deterministic ID) | WhatsApp, Telegram | Hash of sorted user IDs as chat_id |
| DM uniqueness (idempotent open) | Slack, Discord | Unique constraint + idempotent endpoint |
| Aggregate boundary (small aggregates) | Vernon, "Effective Aggregate Design" (2011) | Rules 1-4 |
| Cross-aggregate eventual consistency | Banking sagas, Discord/Slack messaging | Vernon Rule 4 |
| Wide-row schema | Discord | Cassandra `(channel_id, bucket_id)` |
| Sharded MySQL messaging | Slack | `team_id` shard, `channel_id` partition |
| Memory-first messaging | WhatsApp | Mnesia → MySQL archive |
| Edge layer + stateful gateway | Slack | Envoy + Edge servers |
| Sharded gateway | Discord | 256 shards by user_id hash |
| Erlang BEAM transparent distribution | WhatsApp | Per-session processes |
| Stateless gateway + Redis pub/sub | Pusher, Ably | Commercial WebSocket |
| Hot conversation cache | Slack | Memcached for hot channels |
| Outbox pattern for reliable event publish | (general) | Atomic write of domain row + outbox row |

---

## Deferred Decisions

These will be revisited as Epic 6 progresses or in later epics. Not blockers for starting story 6.1.

| Decision | When to revisit | Notes |
|---|---|---|
| Outbox pattern for integration event reliability | When at-least-once isn't enough (e.g., billing-grade messaging) | Standard production fix for "publish after persist" event loss |
| Time-bucket secondary partition for hot conversations | When write contention on a single hot conversation becomes measurable | Requires schema change |
| Redis hot-conversation cache | When read load on hot conversations becomes measurable | Adds another store to maintain |
| Sharded Redis pub/sub (`SSUBSCRIBE`) | When single Redis node CPU saturates on subscribe load | Redis 7+ Cluster mode |
| Lazy materialization for inactive users | When `conversation_list_items` write amplification becomes a real cost | UX-impacting decision |
| Push-vs-pull for huge groups | When supergroups (>1024 members) become a product requirement | New aggregate type likely needed |
| Edit/delete semantics (delete-for-me vs delete-for-everyone) | Not in initial Epic 6 scope; revisit | Schema design question |
| End-to-end encryption | Not in initial scope | Massive design impact if added later |
| Idle/away presence states | Epic 7 | Currently only `online | offline` |
| Outbound message search index (ES) | When users need to search messages | Use CDC pattern, same as Epic 5.3 |

---

## Implementation Roadmap — Story Mapping

Which decisions each story implements:

| Story | Decisions touched |
|---|---|
| **6.1 Start Conversation** | #1 (Conversation aggregate, Membership VO, DM uniqueness via partial unique index) |
| **6.2 Send Text Message** | #2 (Mongo store, per-message doc), #3 (send path: client → WS → gateway → Kafka → message-app), #4 (serverTs assignment) |
| **6.3 View Message History** | #2 (cursor pagination over `(serverTs, _id)`), backfill from DB |
| **6.4 Real-time Delivery** | #3 (Redis pub/sub fan-out), #4 (clients sort by serverTs on receipt), live-delivery-as-latency-optimization principle |
| 6.5 Send Images / 6.6 Send Files | Reuse Epic 2.5 asset infrastructure; integrate with Decision #2 storage shape |
| **6.7 Delivery Status / 6.8 Read Receipts** | Cross-device ack flow (deferred deep-dive; pending production-pattern session) |
| **6.9 Conversations List** | #2 (`conversation_list_items` read model, integration event consumer with coalescing) |
| **6.10-6.12 Group operations** | #1 (Membership VO operations, member cap invariant) |

**Suggested implementation order**: 6.1 → 6.2 → 6.4 → 6.3 → 6.9 → 6.5/6.6 → 6.7/6.8 → 6.10-6.12.

Reasoning: 6.1 establishes the aggregate; 6.2 + 6.4 lock in the send/receive path (the core); 6.3 backfill validates the principle; 6.9 exercises the conversation list read model; media stories layer on existing asset infra; delivery status is its own deep dive; group operations exercise membership invariants on top of an established foundation.

---

## ADR Maintenance

This document supersedes the high-level messaging guidance in `_bmad-output/architecture.md` (notably "sticky sessions" at line 1461 and the `isConversationMember()` reference at line 422 — both predate this deep-dive).

If a story implementation forces a change to one of these decisions, **update this document first** with the change + why, then update the affected story. Do not silently diverge from the ADR in code.
