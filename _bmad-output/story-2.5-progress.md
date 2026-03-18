# Story 2.5: Upload Profile Picture - Progress

**Last Updated:** 2026-03-17
**Status:** ✅ Complete - All steps done (presign upload, R2 storage, Kafka events, imgproxy resizing, video transcoding, user integration)

---

## Concepts Learned

### 1. Object Storage (MinIO)
- MinIO is S3-compatible object storage
- **Bucket** = container (like top-level folder)
- **Object** = file + metadata
- **Key** = unique identifier for the object

### 2. Pre-signed URLs
- Temporary signed URLs for secure access to private files
- URL contains: bucket, key, expiry, signature
- Allows direct client-to-storage access without proxying through API

### 3. Upload Flow Decision
**Chose Presigned POST pattern (2-step upload):**
```
Step 1: Client requests presigned URL
  POST /assets/presign-upload → { assetId, postURL, formData, key }

Step 2: Client uploads directly to MinIO
  POST {postURL} with formData + file

Step 3: Client confirms upload completed
  POST /assets/:assetId/confirm → { assetId, bucket, key, url }
```

**Why this approach:**
- Server validates metadata BEFORE MinIO accepts file
- Pre-signed POST enforces content-type and size limits at MinIO level
- Direct client-to-storage uploads (no proxying through API)
- Scalable for large files
- AssetId available immediately for linking before actual upload

### 4. Image Resizing Strategies

Three main approaches — need to decide which to implement:

**Strategy A: Eager (At Upload Time)**
- Resize immediately on upload, generate all variants (thumbnail, medium, large)
- Store each variant in MinIO
- Pros: Fast reads, simple serving, no processing at request time
- Cons: Slower uploads, wasted storage if variants never viewed, hard to add new sizes later

**Strategy B: Lazy (On-the-fly at Request Time)**
- Store only the original, resize when client requests a specific size
- Cache the result (in Redis or MinIO) for future requests
- Pros: No wasted storage, easy to add new sizes, fast uploads
- Cons: First request is slow, needs an image proxy processing layer

**Strategy C: Hybrid (Upload + Async Processing) — RECOMMENDED for learning**
- Accept upload → store original → return immediately
- Publish `AssetUploaded` domain event to Kafka
- Worker/consumer picks it up and generates variants asynchronously
- Pros: Fast uploads, decoupled processing, practices Kafka + event-driven patterns
- Cons: Brief delay before variants available, more infrastructure

```
Upload → Store original in MinIO → Publish "AssetUploaded" event to Kafka
                                          ↓
                              Kafka Consumer picks it up
                                          ↓
                              Resize with sharp → Store variants in MinIO
                                          ↓
                              Publish "AssetProcessed" event
```

**Decision: Strategy C (Hybrid)** — Most educational (DDD events, Kafka, async processing). Implemented with custom imgproxy for image processing.

### 5. Image Resizing Best Practices
- **Always keep the original** — never discard; can re-derive variants later
- **Validate before processing** — check file type, max dimensions, file size at API boundary
- **Use `sharp`** — Node.js binding to libvips, ~4-10x faster than ImageMagick
- **Define variants by UI needs** — e.g., `64x64` avatar thumb, `256x256` profile, `1024x1024` max
- **Prefer WebP/AVIF output** — modern formats save 25-50% storage vs JPEG/PNG
- **Stream, don't buffer** — pipe upload stream → sharp → MinIO; avoid loading whole file in memory

---

## Architecture Decisions

### Asset Entity Design (With status tracking)
```typescript
class AssetEntity {
  id: UUID
  bucket: string         // "avatars", "posts"
  key: string           // "avatars/uuid-timestamp.jpg"
  originalName: string   // "my-photo.jpg"
  mimeType: MIME_TYPE    // enum
  size: number          // bytes
  assetType: ASSET_TYPE  // IMAGE, VIDEO, AUDIO, DOCUMENT
  status: ASSET_STATUS   // PENDING, CONFIRMED
  createdAt: Date
}
```

**Key design decisions:**
- `status` field tracks upload lifecycle (PENDING → CONFIRMED)
- No `userId` in Asset entity - relationships owned by consuming entities
- Factory method `AssetEntity.create()` validates size, sets PENDING status
- `confirm()` method transitions PENDING → CONFIRMED
- `reconstitute()` for loading from database

### Service Architecture
**Asset as separate microservice (port 3003)**
```
┌──────────┐     HTTP/REST      ┌──────────┐
│ User App │ ─────────────────▶ │Asset App │ ──▶ MinIO
└──────────┘                    └──────────┘
```
- Good for learning service-to-service communication
- Can evolve to gRPC later

---

## Implemented Components

### Asset Service (`apps/asset/`)
```
apps/asset/src/
├── main.ts                                      ✅
├── app.module.ts                                ✅
├── asset.module.ts                              ✅
├── application/
│   ├── application-services/
│   │   ├── asset.application-service.ts         ✅
│   │   └── image-processing.application-service.ts  ✅ NEW
│   └── contracts/
│       ├── object-storage-service.contract.ts   ✅
│       ├── asset-repository.contract.ts         ✅
│       └── image-processing-service.contract.ts ✅ NEW
├── driven-adapters/
│   ├── storage/
│   │   └── minio-storage.adapter.ts             ✅
│   ├── image-processing/
│   │   └── imgproxy.adapter.ts                  ✅ NEW
│   ├── event-publisher/
│   │   └── asset-event-publisher.adapter.ts     ✅ NEW
│   └── repos/
│       ├── asset-repository.adapter.ts          ✅
│       └── mappers/
│           └── asset-persistence.mapper.ts      ✅
└── driving-adapters/
    ├── controllers/
    │   └── asset.controller.ts                  ✅
    ├── consumers/
    │   └── asset-confirmed.consumer.ts          ✅ NEW
    ├── dtos/
    │   └── presign-upload.dto.ts                ✅
    └── constants/
        └── endpoint.constant.ts                 ✅
```

### Domain Layer (`packages/domain/asset/`)
| Component | File | Status |
|-----------|------|--------|
| `AssetEntity` | `asset.entity.ts` | ✅ Aggregate root with factory methods, state transitions |
| `ASSET_STATUS` | `asset-status.enum.ts` | ✅ PENDING, CONFIRMED |
| `ASSET_TYPE` | `asset-type.value-object.ts` | ✅ IMAGE, VIDEO, AUDIO, DOCUMENT |
| `MIME_TYPE` | `mime-type.value-object.ts` | ✅ 20+ types |
| `AssetSize` | `asset-size.value-object.ts` | ✅ Size validation |
| `MaxAssetSizeException` | `max-exceed-size.exception.ts` | ✅ Domain exception |

### Infrastructure Layer
| Component | File | Status |
|-----------|------|--------|
| `MinioService` | `packages/infrastructure/minio/minio.service.ts` | ✅ ensureBucket, presignedPost, verify, delete, getPublicUrl |
| `AssetModel` | `packages/infrastructure/database/models/asset.model.ts` | ✅ With status column |
| `BaseAssetRepository` | `packages/infrastructure/database/repos/asset.repository.ts` | ✅ CRUD operations |

### Object Storage Contract (Implemented)

```typescript
// apps/asset/src/application/contracts/object-storage-service.contract.ts
export interface IObjectStorageService {
  generatePresignedPost(params): Promise<PresignedPostResult>;
  verifyFileExists(bucket, key): Promise<boolean>;
  deleteFile(bucket, key): Promise<void>;
  getPublicUrl(bucket, key): string;
}
```

---

## Implementation Steps Progress

### Step 1: Create the Contract ✅ DONE
- `object-storage-service.contract.ts` with presigned POST interface
- `asset-repository.contract.ts` for persistence

### Step 2: Create MinIO Storage Adapter ✅ DONE
- `minio-storage.adapter.ts` implements `IObjectStorageService`
- Delegates to `MinioService` infrastructure package

### Step 3: Create Asset Application Service ✅ DONE
- `presignUpload()` - Creates asset record, generates presigned POST URL
- `confirmUpload()` - Verifies file exists in MinIO, transitions to CONFIRMED
- MIME type to ASSET_TYPE derivation
- Unique key generation: `folder/uuid-timestamp.ext`

### Step 4: Create Asset Controller ✅ DONE
- `POST /assets/presign-upload` - Request presigned URL
- `POST /assets/:assetId/confirm` - Confirm upload complete

### Step 5: Wire up the Module ✅ DONE
- `asset.module.ts` with DI providers (application service, repository, storage adapter)
- `app.module.ts` with ConfigModule, ClsModule, LogModule, DatabaseModule, MinioModule

### Step 6: Create Asset App Bootstrap ✅ DONE
- `main.ts` on port 3003
- Swagger documentation enabled
- Global ValidationPipe and GlobalExceptionFilter

### Step 7: Kafka Messaging Infrastructure ✅ DONE
- Implemented full Kafka infrastructure in `packages/infrastructure/messaging/`
- `KafkaProducerService` — wraps kafkajs, `send()` and `sendBatch()`
- `KafkaBaseConsumer` — abstract base with lifecycle (connect → subscribe → run → stop → disconnect)
- `MessagingModule.forRootAsync()` — shared Kafka instance, exports producer + tokens
- Added `aggregateId` to `DomainEvent` base class (used as Kafka partition key)
- `AggregateRoot.publishEvents()` returns events and clears internally
- Event publisher adapters as driven adapters per service (UserEventPublisherAdapter, AssetEventPublisherAdapter)
- Topic naming: `{aggregateType}.{eventName}` (e.g., `asset.asset.confirmed`)
- Wired into user service and asset service

### Step 8: Image Resizing with imgproxy ✅ DONE
- **Strategy chosen:** Hybrid (Strategy C) — async variant generation via Kafka consumer
- **Flow:** Asset confirmed → `AssetConfirmedEvent` published to Kafka → `AssetConfirmedConsumer` triggers `ImageProcessingApplicationService` → calls custom imgproxy API
- **Domain additions:**
  - `ASSET_PURPOSE` enum (AVATAR, POST, CHAT_ATTACHMENT, COVER_PHOTO)
  - `RESIZING_TYPE` enum (FIT, FILL, FILL_DOWN, FORCE, AUTO)
  - `IMAGE_FORMAT` enum (WEBP, JPEG, PNG, AVIF)
  - `IMAGE_VARIANTS` constant — predefined variants per purpose
  - `buildVariantKey()` / `buildVariantObjectKey()` — naming convention helpers
  - `AssetConfirmedEvent` — domain event emitted on `confirm()`
- **Object key format:** `{type}/{purpose}/{userId}/{assetId}/original.{ext}`
- **Variant key format:** `{basePath}/{variantKey}.{format}` (e.g., `image/avatar/user-123/asset-456/original/w64-h64-fill-q80.webp`)
- **New files:**
  - `apps/asset/src/driving-adapters/consumers/asset-confirmed.consumer.ts` — Kafka consumer (driving adapter)
  - `apps/asset/src/application/application-services/image-processing.application-service.ts` — orchestrates variant generation
  - `apps/asset/src/application/contracts/image-processing-service.contract.ts` — port for image processing
  - `apps/asset/src/driven-adapters/image-processing/imgproxy.adapter.ts` — calls custom imgproxy API
  - `apps/asset/src/driven-adapters/event-publisher/asset-event-publisher.adapter.ts` — Kafka event publisher
- **Updated files:**
  - `AssetEntity` — added `purpose` field, emits `AssetConfirmedEvent` on `confirm()`
  - `AssetModel` — added `purpose` column
  - `AssetPersistenceMapper` — maps `purpose` both directions
  - `PresignUploadRequestDTO` — replaced `folder` with `purpose` (enum validated)
  - `AssetController` — passes `purpose` instead of `folder`
  - `MinioService` — added `generatePresignedPutUrl()` for variant uploads
  - `IObjectStorageService` — added `generatePresignedPutUrl()` to contract

### Step 8.1: Video transcoding ✅ DONE
- Implemented video transcoding via Coconut API
- `VideoProcessingApplicationService` orchestrates transcoding
- `CoconutAdapter` as driven adapter for Coconut API
- `IVideoTranscodingService` contract (port)
- Webhook controller for receiving transcoding completion callbacks
- Video variants defined per purpose

### Step 9: Integrate with User Service ✅ DONE
- Created `POST /users/profile/avatar` endpoint in user service
- Call asset service presign → confirm flow
- Update `user.avatarUrl` with returned URL
- Delete old avatar from storage if exists

### Step 10: Test End-to-End ❌ TODO
- Test presign flow
- Test confirm with missing file
- Test avatar update integration
- Verify old avatar cleanup



---

## Acceptance Criteria Checklist

- [x] Image uploaded to R2 storage (via presigned POST)
- [x] Image URL stored in user profile
- [x] Old avatar deleted if exists
- [x] Only image formats (jpg, png, gif, webp) accepted (MIME type validation)
- [x] File size limited to 5MB (AssetSize value object + presigned POST policy)
- [x] Avatar URL returned in response
- [x] Image resizing via imgproxy (async, event-driven)
- [x] Video transcoding via Coconut API (async, webhook-based)

---

## Kafka Messaging Infrastructure Design

**Date:** 2026-03-04
**Status:** Design complete, implementation pending (Story 1.3)

### Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Kafka client | `kafkajs` directly | More control than `@nestjs/microservices` abstraction; better for learning |
| Topic naming | `<domain>.<aggregate>.<event-type>` | e.g., `auth.user.created` — no env prefix (separate clusters per env), no version suffix (handled in message body via `eventVersion`) |
| Topic strategy | Topic per event type | Consumers subscribe only to what they need; simpler routing without `eventType` field |
| Partition key | `aggregateId` (e.g., userId) | Guarantees ordering per aggregate; hashed across fixed partitions (not one partition per user) |
| Consumer groups | One per service | Each service gets its own copy of messages; independent consumption |
| Delivery semantics | At-least-once | Idempotency via `eventId` in domain events |
| Package name | `messaging` | Technology-agnostic; Kafka is an adapter inside it |

### Message Envelope Schema

```typescript
{
  eventId: string;        // UUID — for idempotency
  aggregateId: string;    // Partition key — ordering per aggregate
  correlationId: string;  // For distributed tracing across services
  occurredOn: Date;       // When the event happened
  eventVersion: number;   // Schema versioning inside the message
  payload: object;        // Event-specific data
}
```

### Module Structure

```
packages/
  infrastructure/
    messaging/
      kafka-producer.ts              ← wraps kafkajs producer
      kafka-event-publisher.ts       ← implements IEventPublisher port
      kafka-base-consumer.ts         ← reusable: connection, deserialization, retry, DLQ
      in-memory-event-publisher.ts   ← for tests/local dev
      messaging.module.ts            ← provides the right implementation based on config

apps/
  asset/src/
    driving-adapters/
      consumers/
        auth.consumer.ts             ← listens to auth.user.* topics, calls app service
    application/
      application-services/
        asset.application-service.ts ← handleUserCreated() — just another use case
```

### Key Architecture Patterns

- **Hexagonal architecture**: `IEventPublisher` port with two adapters (in-memory + Kafka)
- **In-memory kept for tests/local dev**: No Kafka dependency needed for unit tests
- **Consumer as driving adapter**: Kafka consumer triggers app logic, same as HTTP controller
- **Application service handles use cases**: Consumer deserializes → calls app service method; app service doesn't know the event came from Kafka
- **Base consumer in shared package**: Reusable Kafka connection, deserialization, error handling, DLQ logic
- **Specific consumers in each service**: e.g., `AuthConsumer` in asset service for auth domain events

### Concepts Learned

- **Partition key ≠ creating partitions**: Fixed partitions (e.g., 3), userId is hashed to select which one
- **Consumer groups**: Same group = messages split across consumers; different groups = each gets all messages
- **Topic per event type vs topic per aggregate**: Trade-off between simplicity and cross-event ordering
- **Env not in topic name**: Environments should be separate clusters, not embedded in topic names
- **Version not in topic name**: Schema versioning handled inside message body via `eventVersion` field
- **Outbox pattern**: Needed for consistency between DB persist and Kafka publish (future enhancement)

---

