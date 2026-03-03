# Tech-Spec: Media Service - FE Integration Diagrams

**Created:** 2026-02-10
**Updated:** 2026-03-02
**Status:** Ready for Development

## Overview

### Problem Statement

FE developers need a clear, visual reference to understand how to integrate with the Media Service API — including upload flows, image processing, video transcoding, asset lifecycle, and all request/response contracts.

### Solution

A comprehensive set of PlantUML diagrams covering:

1. System architecture overview
2. Image upload flow (with optional background variants)
3. Video upload flow (with Bitmovin transcoding)
4. On-demand image processing flow
5. Asset deletion flow
6. Asset status state machine
7. R2 storage path structure
8. Complete API endpoint reference with DTOs
9. Complete integration flow overview
10. Error handling reference
11. **Image display fallback flow** (variant → original → placeholder)
12. **Video display fallback flow** (HLS → thumbnail → placeholder)
13. **SDK-based media display guide** (using `@sproux/media-sdk`)

### Scope

**In Scope:**

- All FE-facing API endpoints and their request/response contracts
- Sequence diagrams for every media operation
- Architecture diagram showing FE ↔ Backend ↔ External Services
- Asset lifecycle state machine
- R2 path structure reference

**Out of Scope:**

- Bitmovin webhook internals (server-to-server, not FE-facing)
- DLQ retry mechanics (internal infrastructure)
- Backend-only configuration details

---

## 1. System Architecture Overview

```plantuml
@startuml architecture-overview
!theme plain
skinparam backgroundColor #FFFFFF
skinparam componentStyle rectangle
skinparam defaultFontSize 12

title Media Service - System Architecture (FE Integration)

actor "Frontend\nApplication" as FE #LightBlue

package "Media Service API" as API #LightGreen {
  [POST /media/upload-url] as EP_UPLOAD
  [POST /media/:id/confirm] as EP_CONFIRM
  [GET /media/:id] as EP_GET
  [POST /media/:id/process] as EP_PROCESS
  [DELETE /media/:id] as EP_DELETE
}

database "PostgreSQL" as DB #LightYellow {
  [media_assets] as TBL
}

cloud "Cloudflare R2\n(S3-Compatible)" as R2 #LightCoral {
  [Private Bucket] as BUCKET
}

cloud "CDN" as CDN #LightCyan {
  [Public URLs\n(cdn.example.com)] as CDN_URL
}

cloud "Imgproxy" as IMGPROXY #Orchid {
  [Image Processing\nEngine] as IMG_ENGINE
}

cloud "Bitmovin" as BITMOVIN #Orange {
  [Video Transcoding\n(HLS)] as BIT_ENGINE
}

queue "BullMQ" as QUEUE #LightGray {
  [Background\nVariant Jobs] as JOBS
}

' FE interactions
FE --> EP_UPLOAD : 1. Request upload URL
FE --> BUCKET : 2. PUT file (presigned URL)
FE --> EP_CONFIRM : 3. Confirm upload
FE --> EP_GET : 4. Get asset details
FE --> EP_PROCESS : 5. On-demand image process
FE --> CDN_URL : 6. Load media via CDN
FE --> EP_DELETE : 7. Delete asset

' Backend interactions
EP_UPLOAD --> TBL : Create PENDING record
EP_UPLOAD --> R2 : Generate presigned PUT URL
EP_CONFIRM --> R2 : Verify file exists (HEAD)
EP_CONFIRM --> BIT_ENGINE : Trigger video transcoding
EP_CONFIRM --> JOBS : Enqueue image variants
EP_PROCESS --> IMG_ENGINE : Process image variant
EP_PROCESS --> BUCKET : Store processed variant
EP_GET --> TBL : Read asset record
EP_DELETE --> BUCKET : Delete files
EP_DELETE --> TBL : Soft delete record

' External to R2
BIT_ENGINE --> BUCKET : Write HLS output
IMG_ENGINE --> BUCKET : Write processed image
BUCKET --> CDN_URL : Serve via CDN domain

@enduml
```

## 2. Image Upload Flow (Complete Sequence)

```plantuml
@startuml image-upload-flow
!theme plain
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam defaultFontSize 11

title Image Upload Flow - FE Integration

actor "Frontend" as FE
participant "Media API\n/media" as API
database "PostgreSQL" as DB
participant "Cloudflare R2" as R2
participant "CDN" as CDN
queue "BullMQ" as Q
participant "Imgproxy" as IMG

== Step 1: Request Upload URL ==

FE -> API : **POST /media/upload-url**\n{\n  type: "image",\n  purpose: "avatar",\n  filename: "profile.jpg",\n  contentType: "image/jpeg",\n  contentLength: 204800\n}

API -> DB : Create MediaAsset\nstatus = PENDING
API -> R2 : Generate presigned PUT URL\n(15 min expiry)
API --> FE : **200 OK**\n{\n  uploadUrl: "https://r2...presigned",\n  assetId: "uuid-123",\n  objectKey: "avatar/image/usr-1/abc.jpg",\n  expiresIn: 900\n}

== Step 2: Direct Upload to R2 ==

FE -> R2 : **PUT** uploadUrl\nHeaders:\n  Content-Type: image/jpeg\n  Content-Length: 204800\nBody: <binary file data>
R2 --> FE : **200 OK**

== Step 3: Confirm Upload ==

alt Without variants (immediate READY)
  FE -> API : **POST /media/{assetId}/confirm**\n{ }

  API -> R2 : HEAD object (verify exists)
  R2 --> API : 200 (exists, size=204800)
  API -> DB : Update status = READY\nUpdate fileSize = 204800
  API --> FE : **200 OK**\n{\n  asset: {\n    id: "uuid-123",\n    type: "image",\n    purpose: "avatar",\n    status: "ready",\n    isReady: true,\n    ...\n  }\n}

else With background variants
  FE -> API : **POST /media/{assetId}/confirm**\n{\n  variants: [\n    { width: 200, height: 200, resizeType: "fill", format: "webp" },\n    { width: 800, height: 600, resizeType: "fit", format: "webp" }\n  ]\n}

  API -> R2 : HEAD object (verify exists)
  R2 --> API : 200 (exists)
  API -> DB : Update status = PROCESSING
  API -> Q : Enqueue variant generation jobs
  API --> FE : **200 OK**\n{\n  asset: {\n    status: "processing",\n    isProcessing: true\n  }\n}

  == Background Processing ==

  Q -> IMG : Process variant 200x200
  IMG -> R2 : Store avatar/image/usr-1/abc-200x200-fill.webp
  Q -> IMG : Process variant 800x600
  IMG -> R2 : Store avatar/image/usr-1/abc-800x600-fit.webp
  Q -> DB : Update status = READY
end
@enduml
```

## 3. Image Display Fallback Flow

```plantuml
@startuml image-display-fallback
!theme plain
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam defaultFontSize 11

title Image Display with Fallback Chain (using @sproux/media-sdk)

actor "Frontend" as FE
participant "CDN" as CDN
participant "Media API\n/media" as API
participant "Cloudflare R2" as R2
participant "Imgproxy" as IMG

== Step 1: Try Variant URL Directly ==

note over FE
  **Build variant URL via SDK (no status check):**
  media.getImageUrl(objectKey, {
    width: 400, height: 400,
    resizeType: 'fill', format: 'webp'
  })
  FE always tries the variant URL first,
  regardless of asset status.
end note

FE -> CDN : **GET** variant URL\nabc-400x400-fill.webp
CDN -> R2 : Fetch variant object

alt Variant exists in R2
  R2 --> CDN : 200 OK (image binary)
  CDN --> FE : **200** Variant image
  note over FE #LightGreen
    **Success** — display variant image
  end note

else Variant 404 (not yet generated)
  R2 --> CDN : 404 Not Found
  CDN --> FE : **404 Not Found**

  == Step 2: Fallback to Original + Trigger Processing ==

  note over FE #LightYellow
    **img.onerror triggered — two actions in parallel:**
    1. Switch img.src to original URL (immediate display)
    2. Call POST /media/:id/process in background
       to generate variant for next time
  end note

  FE -> CDN : **GET** original URL\nabc.jpg
  CDN -> R2 : Fetch original object

  alt Original exists in R2
    R2 --> CDN : 200 OK (image binary)
    CDN --> FE : **200** Original image
    note over FE #LightGreen
      **Fallback success** — display original image
    end note

  else Original also 404
    R2 --> CDN : 404 Not Found
    CDN --> FE : **404 Not Found**

    note over FE #LightCoral
    **Both variant and original image are 404**
    Display static placeholder:
    /images/placeholder-image.svg
    end note
    FE -> FE : Show placeholder-video.svg
  end

  == Background: Generate Variant for Next Time ==

  note over FE #Lavender
    **Fired in parallel with original fallback.**
    Don't block the UI — this runs in background.
    Next page load will hit the variant URL directly.
  end note

  FE -[#gray]-> API : POST /media/{assetId}/process\n{ width: 400, height: 400, ... }
  API -> IMG : Generate variant
  IMG -> R2 : Store abc-400x400-fill.webp
  API --[#gray]-> FE : { url: "...abc-400x400-fill.webp" }
end

== Next Page Load ==

note over FE #LightCyan
  **On subsequent loads, the variant exists in R2.**
  FE tries variant URL → CDN hit → instant display.
  No fallback or process call needed.
end note

@enduml
```

## 4. Video Upload Flow (with Bitmovin Transcoding)

```plantuml
@startuml video-upload-flow
!theme plain
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam defaultFontSize 11

title Video Upload Flow - FE Integration

actor "Frontend" as FE
participant "Media API\n/media" as API
database "PostgreSQL" as DB
participant "Cloudflare R2" as R2
participant "Bitmovin\nTranscoding" as BIT
participant "CDN" as CDN

== Step 1: Request Upload URL ==

FE -> API : **POST /media/upload-url**\n{\n  type: "video",\n  purpose: "gallery",\n  filename: "campaign.mp4",\n  contentType: "video/mp4",\n  contentLength: 52428800\n}

API -> DB : Create MediaAsset\nstatus = PENDING
API -> R2 : Generate presigned PUT URL\n(15 min expiry)
API --> FE : **200 OK**\n{\n  uploadUrl: "https://r2...presigned",\n  assetId: "uuid-456",\n  objectKey: "gallery/video/usr-1/xyz.mp4",\n  expiresIn: 900\n}

== Step 2: Direct Upload to R2 ==

FE -> R2 : **PUT** uploadUrl\nHeaders:\n  Content-Type: video/mp4\n  Content-Length: 52428800\nBody: <binary video data>

note right of FE
  **FE Note:** For large videos,
  consider showing upload progress
  bar using XMLHttpRequest or
  fetch with ReadableStream.
end note

R2 --> FE : **200 OK**

== Step 3: Confirm Upload (Triggers Transcoding) ==

FE -> API : **POST /media/{assetId}/confirm**\n{ }

API -> R2 : HEAD object (verify exists)
R2 --> API : 200 (exists, size=52428800)

API -> BIT : Create HLS transcoding job\n(input: presigned R2 URL\n output: R2 bucket)
BIT --> API : jobId: "bit-encoding-789"

API -> DB : Update status = PROCESSING\nSet transcodingJobId = "bit-encoding-789"
API --> FE : **200 OK**\n{\n  asset: {\n    id: "uuid-456",\n    type: "video",\n    status: "processing",\n    isProcessing: true\n  }\n}

== Step 4: FE Polls for Status ==

note over FE
  **FE should poll GET /media/:id**
  every ~30s until status changes
  from "processing" to "ready" or "error"
end note

loop Every 30 seconds
  FE -> API : **GET /media/{assetId}**
  API -> DB : Read asset
  API --> FE : { status: "processing", isProcessing: true }
end

note over FE #LightYellow
  **While processing:** FE can play
  the raw mp4 via **originalUrl**
  as a fallback until HLS is ready.
end note

== Background: Bitmovin Completes ==

BIT -> R2 : Write HLS segments:\n  gallery/video/usr-1/xyz/playlist.m3u8\n  gallery/video/usr-1/xyz/360p/\n  gallery/video/usr-1/xyz/720p/\n  gallery/video/usr-1/xyz/1080p/\n  gallery/video/usr-1/xyz/thumbnail.jpg
BIT -> API : **Webhook POST /webhooks/bitmovin**\neventType: ENCODING_FINISHED
API -> DB : Update status = READY

@enduml
```

## 5. Video Display Fallback Flow

```plantuml
@startuml video-display-fallback
!theme plain
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam defaultFontSize 11

title Video Display with Fallback Chain (using @sproux/media-sdk)

actor "Frontend" as FE
participant "CDN" as CDN

== Step 1: Fetch Video Thumbnail via SDK ==

note over FE
  **Build thumbnail URL via SDK:**
  media.getVideoThumbnailUrl(objectKey)
  → ".../xyz/thumbnail.jpg"

  **SDK method signature:**
  getVideoThumbnailUrl(
    objectKey: string,
    options?: { format?: 'jpg' | 'webp' }
  ): string

  **R2 path convention:**
  {purpose}/video/{userId}/{assetId}/thumbnail.jpg
  Thumbnail is auto-generated by Bitmovin
  during transcoding (written alongside HLS segments).
end note

FE -> CDN : **GET** thumbnail URL\nxyz/thumbnail.jpg

alt Thumbnail exists (transcoding completed)
  CDN --> FE : **200** thumbnail image
  note over FE #LightGreen
    **Use as <video poster>**
    <video poster={thumbnailUrl} ...>
    Displayed while video loads or before play.
  end note

else Thumbnail 404 (transcoding not yet finished)
  CDN --> FE : **404 Not Found**
  note over FE #LightYellow
    **Fallback:** Use a static placeholder image.
    <video poster="/images/placeholder-video.svg" ...>
    Once transcoding completes, next page load
    will find the thumbnail in R2.
  end note
end

== Step 2: Get HLS Playlist ==

note over FE
  **Build HLS URL via SDK (no status check):**
  media.getVideoHlsUrl(objectKey)
  → ".../xyz/playlist.m3u8"
end note

FE -> CDN : **GET** HLS playlist URL\nxyz/playlist.m3u8

alt HLS playlist exists
  CDN --> FE : **200** playlist.m3u8

  note over FE #LightGreen
    **Success** — play adaptive HLS video
    Use hls.js (or Safari native) for playback.
    poster = media.getVideoThumbnailUrl(objectKey)
  end note

  FE -> CDN : GET 720p/segment_001.ts
  CDN --> FE : Video segments (streaming)

else HLS playlist 404 (not yet transcoded or unavailable)
  CDN --> FE : **404 Not Found**

  == Step 3: Fallback to Original Video File ==

  note over FE #LightYellow
    **HLS not available — use original video file**
    media.getVideoOriginalUrl(objectKey)
    → ".../xyz.mp4"
  end note

  FE -> CDN : **GET** original video URL\nxyz.mp4

  alt Original video exists
    CDN --> FE : **200 video binary**
    note over FE #LightGreen
      **Fallback success** — play original mp4
      via native <video> element.
      Still use thumbnail as poster if available.
    end note

  else Original also 404
    note over FE #LightCoral
      **Both HLS + original failed**
      Display static placeholder:
      /images/placeholder-video.svg
    end note
    FE -> FE : Show placeholder-video.svg
  end
end

== SDK Thumbnail Reference ==

note over FE #LightCyan
  **@sproux/media-sdk — Video Thumbnail Methods:**

  // Get thumbnail URL (auto-generated by Bitmovin)
  const posterUrl = media.getVideoThumbnailUrl(objectKey);

  // Full usage with <video> element
  <video
    poster={media.getVideoThumbnailUrl(objectKey)}
    src={media.getVideoHlsUrl(objectKey)}
  />

  // With onError fallback for thumbnail
  <img
    src={media.getVideoThumbnailUrl(objectKey)}
    onError={(e) => {
      e.target.src = '/images/placeholder-video.svg';
    }}
  />

  **Thumbnail availability:**
  - Available after Bitmovin transcoding completes
  - Path: {objectKey}/thumbnail.jpg in R2
  - Served via CDN like all other assets
  - No separate API call needed — direct CDN fetch
end note

@enduml
```

## 6. Asset Deletion Flow

```plantuml
@startuml delete-asset-flow
!theme plain
skinparam backgroundColor #FFFFFF
skinparam sequenceMessageAlign center
skinparam defaultFontSize 11

title Asset Deletion Flow - FE Integration

actor "Frontend" as FE
participant "Media API\n/media" as API
database "PostgreSQL" as DB
participant "Cloudflare R2" as R2

== Delete Image Asset ==

FE -> API : **DELETE /media/{assetId}**\nAuthorization: Bearer <jwt>

API -> DB : Find asset by ID + owner
DB --> API : MediaAsset found

API -> R2 : Delete original file\n(avatar/image/usr-1/abc.jpg)
API -> R2 : Delete all variant files\n(avatar/image/usr-1/abc-*.webp)
API -> DB : Soft delete record\n(set deletedAt timestamp)
API --> FE : **200 OK**

== Delete Video Asset ==

FE -> API : **DELETE /media/{assetId}**\nAuthorization: Bearer <jwt>

API -> DB : Find asset by ID + owner
DB --> API : MediaAsset found (type=video)

API -> R2 : List objects with prefix:\ngallery/video/usr-1/xyz/
R2 --> API : [playlist.m3u8, thumbnail.jpg,\n 360p/*, 720p/*, 1080p/*]
API -> R2 : Bulk delete: original + all HLS files
API -> DB : Soft delete record
API --> FE : **200 OK**

@enduml
```

