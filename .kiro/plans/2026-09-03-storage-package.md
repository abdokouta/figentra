---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/storage — architecture plan

**Status:** Planned (port from `.ref/packages/storage` — currently
`@nesvel/nestjs-storage`) **Anchor ADRs:**
[ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/storage/` — has local + S3 + MinIO drivers. **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/support`,
`@stackra/logger`

## Purpose

`@stackra/storage` is the workspace's canonical OBJECT STORAGE abstraction —
put/get/delete objects, generate presigned URLs, stream uploads/downloads.
Distinct from `@stackra/file-system` (local FS I/O).

Enterprise requirements day one:

- **Multiple named buckets** — `avatars`, `uploads`, `exports`, `archives` —
  each with its own driver + config.
- **5 drivers** — Local (filesystem), S3 (AWS), MinIO (self-hosted S3),
  Cloudflare R2 (Worker-native, S3-API compatible), Azure Blob (optional).
- **Presigned URLs** — for direct-from-client uploads/downloads without proxying
  through the server.
- **Multipart uploads** — for large files (>5MB). Client fetches parts, server
  stitches.
- **Streaming** — put/get via `ReadableStream` / `Readable` for zero-copy on
  large files.
- **Content-Type + metadata** — arbitrary object metadata; ACL support (public
  vs private).
- **Copy / move** — server-side copy without downloading.
- **Signed downloads with expiration** — time-limited access.
- **Storage classes** — S3 Standard, Standard-IA, Glacier per driver.
- **Encryption** — server-side encryption (SSE-S3, SSE-KMS, SSE-C).
- **Lifecycle policies** — driver-native (S3 lifecycle, R2 native, MinIO
  policies).
- **NestJS `@InjectStorage()` + `@UploadFile()` decorators** — from .ref.

## Non-goals

- Local file-system I/O (that's `@stackra/file-system`).
- CDN configuration (platform-level — Cloudflare CDN configured out-of-band).
- Image transformation (that's `@stackra/image-transform` — future).

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

`StorageManager extends MultipleInstanceManager<IStorageDriver>` — each named
bucket is its own instance.

```typescript
StorageModule.forRoot({
  default: "uploads",
  buckets: {
    avatars: {
      driver: "s3",
      bucket: "app-avatars",
      region: "us-east-1",
      accessKeyId: "…",
      secretAccessKey: "…",
      publicAcl: true,
    },
    uploads: {
      driver: "s3",
      bucket: "app-uploads",
      region: "us-east-1",
    },
    reports: {
      driver: "r2",
      accountId: "…",
      bucket: "reports",
      apiToken: "…",
    },
    local: {
      driver: "local",
      root: "./storage/local",
    },
  },
});
```

## Subpath layout (per ADR-0091)

Reference is flat (`src/drivers/local`, `src/drivers/s3`, `src/drivers/minio`);
reorganise to ADR-0091:

```
packages/storage/
├── src/
│   ├── core/
│   │   ├── storage.module.ts
│   │   ├── commands/                  # CLI: storage:list, storage:sync, storage:copy
│   │   ├── constants/
│   │   ├── decorators/                # @InjectStorage(bucket?), @UploadFile()
│   │   ├── drivers/                   # (from .ref) local, s3, minio
│   │   │   ├── local/
│   │   │   ├── s3/
│   │   │   └── minio/
│   │   ├── enums/                     # StorageClass, Acl
│   │   ├── errors/                    # ObjectNotFoundError, ObjectAlreadyExistsError, DriverError
│   │   ├── interfaces/
│   │   ├── services/                  # StorageManager, StorageService, PresignedUrlService
│   │   ├── streams/                   # multipart helpers
│   │   ├── types/
│   │   ├── utils/                     # key sanitizer, MIME detector, etag calculator
│   │   └── index.ts
│   │
│   ├── s3/                            # optional peer: @aws-sdk/client-s3
│   │   ├── s3.driver.ts
│   │   ├── presigner.ts
│   │   └── index.ts
│   │
│   ├── r2/                            # NEW — Cloudflare R2 (S3-API-compat + Worker binding)
│   │   ├── r2-http.driver.ts          # via aws-sdk for Node deployments
│   │   ├── r2-binding.driver.ts       # via env.R2_BUCKET for Workers
│   │   └── index.ts
│   │
│   ├── minio/                         # optional peer: minio
│   │   ├── minio.driver.ts
│   │   └── index.ts
│   │
│   ├── azure/                         # NEW optional — @azure/storage-blob
│   │   ├── azure-blob.driver.ts
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── storage.module.ts
│   │   ├── interceptors/              # FileUploadInterceptor
│   │   ├── pipes/                     # ParseFilePipe
│   │   ├── health/
│   │   │   └── storage.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── storage.module.ts
│   │   ├── drivers/
│   │   │   └── r2-binding.driver.ts   # env.<BUCKET> binding
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-storage.ts             # in-memory driver
│       ├── temp-bucket-fixture.ts     # per-test temp bucket
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                | Kind      |
| --------------------- | --------- |
| `IStorageDriver`      | interface |
| `IStorageManager`     | interface |
| `IStorageService`     | interface |
| `IStorageObject`      | interface |
| `IStorageMetadata`    | interface |
| `IPresignOptions`     | interface |
| `IMultipartUpload`    | interface |
| `StorageClass` enum   | enum      |
| `Acl` enum            | enum      |
| `STORAGE_MANAGER`     | token     |
| `STORAGE_DEFAULT`     | token     |
| `ObjectNotFoundError` | class     |
| `StorageDriverError`  | class     |

## Core API (locked)

```typescript
interface IStorageDriver {
  // Object CRUD
  put(key: string, body: Body, options?: IPutOptions): Promise<IStorageObject>;
  get(key: string): Promise<IStorageObjectData>;
  getStream(key: string): Promise<ReadableStream>;
  head(key: string): Promise<IStorageMetadata | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // Bulk
  list(options?: IListOptions): AsyncIterable<IStorageObject>;
  deleteMany(keys: string[]): Promise<void>;

  // Server-side copy
  copy(
    sourceKey: string,
    destKey: string,
    options?: ICopyOptions,
  ): Promise<IStorageObject>;
  move(sourceKey: string, destKey: string): Promise<IStorageObject>;

  // Presigned URLs
  presignPut(key: string, options: IPresignOptions): Promise<string>;
  presignGet(key: string, options: IPresignOptions): Promise<string>;

  // Multipart (for large uploads)
  multipart(key: string, options?: IMultipartOptions): IMultipartUpload;

  // Metadata
  setMetadata(key: string, metadata: Record<string, string>): Promise<void>;
  getMetadata(key: string): Promise<Record<string, string>>;

  // Introspection
  getBucketName(): string;
  getPublicUrl(key: string): string | null; // null if bucket is private
}

type Body = Uint8Array | ReadableStream | Buffer | string | Blob;
```

## Drivers

| Driver       | Home                                  | Runtime       | Deps                                                  |
| ------------ | ------------------------------------- | ------------- | ----------------------------------------------------- |
| `local`      | `core/drivers/local/`                 | Node          | node:fs (no external deps)                            |
| `s3`         | `s3/s3.driver.ts`                     | Node + Worker | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| `minio`      | `minio/minio.driver.ts`               | Node          | `minio`                                               |
| `r2-http`    | `r2/r2-http.driver.ts`                | Node          | `@aws-sdk/client-s3` (R2 is S3-compat)                |
| `r2-binding` | `worker/drivers/r2-binding.driver.ts` | Worker only   | env.R2_BUCKET binding (no HTTP overhead)              |
| `azure-blob` | `azure/azure-blob.driver.ts`          | Node          | `@azure/storage-blob`                                 |
| `memory`     | `testing/mock-storage.ts`             | Every         | None                                                  |

## Presigned URLs

Client-direct upload pattern (avoid server proxying large files):

```typescript
// 1. Server generates presigned PUT URL
const uploadUrl = await storage
  .instance("uploads")
  .presignPut("user/123/profile.jpg", {
    expiresIn: 300, // seconds
    contentType: "image/jpeg",
    contentLengthMax: 10 * 1024 * 1024, // 10 MB
  });

// 2. Client uploads DIRECTLY to storage
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg" },
  body: fileBlob,
});

// 3. Client notifies server on completion
await http.post("/api/profile/finalize", { key: "user/123/profile.jpg" });
```

## Multipart uploads

For files >5MB (S3 recommendation):

```typescript
const upload = storage.instance("uploads").multipart("large-video.mp4", {
  partSize: 5 * 1024 * 1024,
  concurrency: 4,
});

await upload.initiate();

for (const chunk of fileChunks) {
  await upload.uploadPart(chunk.partNumber, chunk.data);
}

await upload.complete();
```

Under the hood: S3 driver uses `CreateMultipartUpload` + `UploadPart` +
`CompleteMultipartUpload`. Local driver simulates via `fs.createWriteStream` +
append.

## Cloudflare R2 (Worker native)

Workers get their own driver bound to `env.<BUCKET>`:

```typescript
// wrangler.jsonc
{
  "r2_buckets": [
    { "binding": "UPLOADS", "bucket_name": "app-uploads" }
  ]
}

// Worker
StorageModule.forRoot({
  default: "uploads",
  buckets: {
    uploads: {
      driver: "r2-binding",
      binding: "UPLOADS",  // matches wrangler binding
    },
  },
});
```

Uses `env.UPLOADS.put(key, body)` directly — no HTTP round-trip. For Node
deployments that need R2, use `r2-http` driver via S3 API compatibility.

## NestJS decorators

```typescript
@Controller("avatars")
export class AvatarController {
  public constructor(
    @InjectStorage("avatars") private readonly avatars: IStorageDriver,
  ) {}

  @Post()
  @UseInterceptors(FileUploadInterceptor)
  public async upload(
    @UploadFile() file: IUploadedFile,
  ): Promise<{ url: string }> {
    const key = `avatars/${file.filename}`;
    await this.avatars.put(key, file.buffer, { contentType: file.mimeType });
    return { url: this.avatars.getPublicUrl(key)! };
  }
}
```

## Health indicator

`StorageHealthIndicator` reports per bucket:

- Reachability (PUT + DELETE test key).
- Latency.
- Free space (local driver only).
- Access permissions (list, get, put — reports if any denied).

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",
    "minio": "^8.0.0",
    "@azure/storage-blob": "^12.30.0",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "@aws-sdk/client-s3": { "optional": true },
    "@aws-sdk/s3-request-presigner": { "optional": true },
    "minio": { "optional": true },
    "@azure/storage-blob": { "optional": true },
  },
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

### Phase 2 — Port .ref (3 days)

- [ ] Copy local, S3, MinIO drivers.
- [ ] Rename package `@nesvel/nestjs-storage` → `@stackra/storage`.
- [ ] Copy decorators (`@InjectStorage`, `@UploadFile`).
- [ ] Copy `StorageFactoryService` → merge into `StorageManager`.

### Phase 3 — Manager alignment (1 day)

- [ ] `StorageManager extends MultipleInstanceManager<IStorageDriver>`.

### Phase 4 — Add missing drivers (3 days)

- [ ] R2 HTTP driver (S3-API-compat).
- [ ] R2 binding driver (Worker-only, uses env.<BUCKET>).
- [ ] Azure Blob driver.

### Phase 5 — Multipart + Presign polish (2 days)

- [ ] `IMultipartUpload` per driver.
- [ ] `presignPut` w/ `contentLengthMax` enforcement.

### Phase 6 — NestJS + Worker (2 days)

- [ ] `StorageModule.forRoot()` for both runtimes.
- [ ] `FileUploadInterceptor` for Nest.
- [ ] `StorageHealthIndicator`.

### Phase 7 — Testing (1 day)

- [ ] `MockStorage` w/ in-memory.
- [ ] `createTempBucket()` fixture using localstack S3.

### Phase 8 — Docs + Release (2 days)

**Total effort:** 16 days.

## Success criteria

- [ ] 8 subpath exports build cleanly.
- [ ] S3, MinIO, R2, local drivers all round-trip put/get/delete.
- [ ] R2-binding driver works in Worker via Miniflare.
- [ ] Presigned PUT URL works (direct-upload from browser).
- [ ] Multipart upload of 100MB file succeeds.
- [ ] `@InjectStorage("bucket")` decorator injects the right driver.
- [ ] Health indicator reports per-bucket reachability.

## Cross-references

- ADR-0090, 0091, 0092.
- `.kiro/plans/2026-09-03-file-system-package.md` — sibling (local FS I/O).
- `.kiro/plans/2026-09-03-cache-package.md` — StorageStore uses this package's
  local driver.
- `.ref/packages/storage/` — reference (3 drivers).
