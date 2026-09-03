---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/media` — secure media ingestion and processing boundary

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0021  
**Depends on:** `@stackra/contracts`, `@stackra/storage`, `@stackra/schema`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 16 days across 8 phases

## Purpose

Own media metadata and secure upload/download workflows while delegating bytes to object storage. Supports upload sessions, MIME sniffing, checksums, thumbnails/transcoding hooks, virus scanning, signed URLs, retention and quotas.

## Non-goals

- Object storage implementation.
- Image/video codec implementation.
- CDN configuration.

## Manager pattern

`MediaManager extends MultipleInstanceManager<IMediaProvider>` where named profiles select validation/processing policies; storage remains injected separately.

## Subpath layout

```text
packages/media/
├── src/core/{media.module.ts,manager/,uploads/,metadata/,validation/,processing/,security/,retention/,errors/,index.ts}
├── src/storage/{object-store-adapter.ts,index.ts}
├── src/nestjs/{media.module.ts,interceptors/,index.ts}
├── src/worker/{upload-handler.ts,index.ts}
├── src/react/{hooks/,components/,index.ts}
├── src/native/{pickers/,hooks/,index.ts}
├── src/testing/{media-fixture.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/media` owns `IMediaObject`, `IUploadSession`, `IMediaValidator`, `IMediaProcessor`, `IMediaScanner`, `IMediaPolicy` and `MEDIA_MANAGER`.

## Public API — locked

```ts
interface IMediaService {
  initiateUpload(input: IUploadRequest): Promise<IUploadSession>;
  finalizeUpload(sessionId: string): Promise<IMediaObject>;
  get(id: string): Promise<IMediaObject>;
  delete(id: string): Promise<void>;
}
```

Uploads are resumable and checksum-bound. The finalization step verifies object existence, checksum, size, detected MIME, policy and tenant ownership before marking metadata ready.

## Security

Never trust filename extension or client MIME. Sniff content, enforce size/quota, sanitize filenames/keys, scan for malware, prevent SSRF in import-by-URL flows, require signed short-lived URLs and isolate tenant object prefixes. Private media never becomes public through metadata alone.

## Errors / recovery / observability

Incomplete uploads expire and are garbage-collected. Processing failures are retryable only when safe. Metrics cover upload bytes, validation failures, scan outcomes, processing duration and orphaned sessions. Audit all privileged media access.

## Persistence / compatibility

Metadata lives in the service database; bytes live in object storage. Schema versions cover metadata and processing status. Storage deletion is asynchronous only after metadata records the deletion intent and retry state.

## Testing / conformance

Test MIME spoofing, zip bombs/oversized payloads, checksum mismatch, partial upload, duplicate finalize, signed URL expiry, tenant leakage and scanner failures. Use real object-storage integration for end-to-end upload flows.

## Dependencies / exports / versioning

Storage/schema provider dependencies are injected; codec/scanner vendors are optional peers. Runtime-specific upload adapters are isolated. Public metadata changes require semver.

## Phases

1. Contracts/scaffold (2d); 2. upload/session engine (3d); 3. validation/security (2d); 4. storage integration (2d); 5. processing/scanning hooks (2d); 6. Nest/Worker/UI adapters (2d); 7. conformance/observability (2d); 8. docs/release (1d).

## Exit criteria

No unvalidated media reaches durable application state; upload finalization is idempotent; signed access is bounded; tenant isolation and cleanup are verified.

## Cross-references

`2026-09-03-storage-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-sync-package.md`, ADR-0021.
