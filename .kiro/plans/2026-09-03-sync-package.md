---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/sync` — offline-first synchronization engine

**Status:** Planned  
**Anchor ADRs:** ADR-0006, ADR-0012, ADR-0023, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/storage`, `@stackra/schema`, `@stackra/errors`, `@stackra/logger`, `@stackra/events`  
**Design effort:** 18 days across 9 phases

## Purpose

Provide deterministic pull/push synchronization for offline clients. The engine owns cursors, mutation queues, retries, deduplication, conflict resolution, tombstones, batching and resumability. It never assumes a particular local database.

## Non-goals

- Authentication or authorization.
- Arbitrary database replication.
- Binary/media transport (integrates with `@stackra/media`).

## Manager pattern

`SyncManager extends MultipleInstanceManager<ISyncStore>` where each named dataset has an independent sync configuration and storage binding.

## Subpath layout

```text
packages/sync/
├── src/core/{sync.module.ts,engine/,pull/,push/,conflicts/,cursors/,queue/,protocol/,errors/,index.ts}
├── src/react/{hooks/,provider/,index.ts}
├── src/native/{connectivity/,lifecycle/,index.ts}
├── src/worker/{sync.module.ts,index.ts}
├── src/nestjs/{sync.module.ts,index.ts}
├── src/testing/{sync-fixture.ts,server-harness.ts,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/sync` owns `ISyncEngine`, `ISyncAdapter`, `ISyncMutation`, `ISyncCursor`, `IConflict`, `ISyncCheckpoint`, conflict policies and `SYNC_MANAGER`.

## Public API — locked

```ts
interface ISyncEngine {
  pull(options?: IPullOptions): Promise<ISyncReport>;
  push(options?: IPushOptions): Promise<ISyncReport>;
  sync(options?: ISyncOptions): Promise<ISyncReport>;
  pause(): void;
  resume(): void;
}
```

Protocol is cursor-based and idempotent. Every mutation has a client-generated ID, idempotency key, timestamp and schema version. Server acknowledgements advance the checkpoint only after durable application.

## Conflict model

Reference data is server-wins. Inspector/user-created mutations default to client-wins when the server has not modified the same logical record; otherwise a deterministic conflict record is produced. Custom conflict resolvers are explicit and tested. No last-write-wins shortcut is allowed for protected fields.

## Configuration / security

Limits cover batch size, payload bytes, queue depth, retry attempts and tombstone retention. Tenant identity is signed/trusted server-side. Local queues are encrypted where the runtime supports secure storage; tokens never enter mutation payloads.

## Errors / recovery / observability

Network failures are resumable; schema conflicts are terminal until application resolution; authorization failures stop the queue. Metrics cover pull/push latency, queue depth, conflict count, retry count and bytes. Correlation IDs flow through every batch.

## Persistence / compatibility

Local sync metadata is versioned and migratable. Server protocol uses `@stackra/schema`. Tombstones have explicit retention and compaction rules. A protocol version cannot be silently downgraded.

## Testing / conformance

Test offline/online transitions, duplicate delivery, out-of-order batches, partial failure, conflict resolution, cursor replay, tombstones, quota exhaustion and tenant isolation. Run deterministic property tests over mutation sequences.

## Dependencies / exports / versioning

Root is runtime-neutral. React/native/Nest/Worker are isolated subpaths. Storage/database implementations are adapters. Public protocol changes require semver and schema compatibility review.

## Phases

1. Contracts/scaffold (2d); 2. local queue/checkpoints (2d); 3. pull protocol (2d); 4. push/idempotency (3d); 5. conflict engine (2d); 6. runtime integrations (2d); 7. security/limits (1d); 8. conformance tests (3d); 9. docs/release (1d).

## Exit criteria

Resumable sync works after crashes, duplicate mutations are safe, conflicts are explicit, cursors cannot regress, tenant boundaries hold, and all adapters pass the same protocol suite.

## Cross-references

`2026-09-03-storage-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-media-package.md`, ADR-0012/0023.
