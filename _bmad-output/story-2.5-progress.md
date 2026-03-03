# Story 2.5: Upload Profile Picture - Progress

**Last Updated:** 2026-02-23
**Status:** In Progress - Steps 1-6 complete, Step 7 (User integration) remaining

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

**Decision: TBD** — Strategy C is most educational (DDD events, Kafka, async processing)

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
│   │   └── asset.application-service.ts         ✅
│   └── contracts/
│       ├── object-storage-service.contract.ts   ✅
│       └── asset-repository.contract.ts         ✅
├── driven-adapters/
│   ├── storage/
│   │   └── minio-storage.adapter.ts             ✅
│   └── repos/
│       ├── asset-repository.adapter.ts          ✅
│       └── mappers/
│           └── asset-persistence.mapper.ts      ✅
└── driving-adapters/
    ├── controllers/
    │   └── asset.controller.ts                  ✅
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

### Step 7: Integrate with User Service ❌ TODO
- Create `POST /users/profile/avatar` endpoint in user service
- Call asset service presign → confirm flow
- Update `user.avatarUrl` with returned URL
- Delete old avatar from MinIO if exists

### Step 8: Test End-to-End ❌ TODO
- Test presign flow
- Test confirm with missing file
- Test avatar update integration
- Verify old avatar cleanup

### Step 9: Image Resizing ❌ TODO
- Choose resizing strategy (see Section 4 above for options A/B/C)
- Implement based on chosen strategy

---

## Acceptance Criteria Checklist

- [x] Image uploaded to MinIO storage (via presigned POST)
- [ ] Image URL stored in user profile (needs user service integration)
- [ ] Old avatar deleted if exists (needs user service integration)
- [x] Only image formats (jpg, png, gif, webp) accepted (MIME type validation)
- [x] File size limited to 5MB (AssetSize value object + presigned POST policy)
- [ ] Avatar URL returned in response (needs user service integration)

---

## To Resume Session

Tell Claude:
> "Continue Story 2.5 - I need to work on Step 7: Integrate with User Service"

Remaining work:
1. Create avatar upload endpoint in user service
2. Service-to-service communication (user → asset)
3. Old avatar cleanup logic
4. End-to-end testing
