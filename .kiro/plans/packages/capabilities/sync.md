---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/sync"
anchor_adrs: [ADR-0012, ADR-0023, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/storage", "@stackra/schema", "@stackra/errors", "@stackra/logger", "@stackra/events"]
---
# `@stackra/sync` — offline-first synchronization engine

## Purpose
Deterministic pull/push synchronization for offline clients. Sync owns cursors, local mutation queues, retries, deduplication, batching, checkpoints, resumability, tombstones and conflict resolution. It never owns a business entity or assumes a particular local database.

## Non-goals
Authentication/authorization, arbitrary database replication, binary/media transport and business conflict policy beyond the explicit resource contract.

## Manager pattern
`SyncManager` manages named datasets. Each dataset has its own protocol version, storage binding, cursor and conflict policy. There is no global queue shared by unrelated resources.

## Source tree
```text
packages/sync/
├── src/core/{sync.module.ts,engine/,pull/,push/,conflicts/,cursors/,queue/,protocol/,errors/,limits/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{connectivity/,lifecycle/,index.ts}
├── src/worker/{sync.module.ts,index.ts}
├── src/nestjs/{sync.module.ts,index.ts}
├── src/testing/{sync-fixture.ts,server-harness.ts,index.ts}
└── __tests__/{unit,property,integration,conformance}/
```

## Public API — locked
```ts
interface ISyncEngine {
  initialSync(options?:InitialSyncOptions):Promise<SyncReport>;
  pull(options?:PullOptions):Promise<SyncReport>;
  push(options?:PushOptions):Promise<SyncReport>;
  sync(options?:SyncOptions):Promise<SyncReport>;
  pause():void;
  resume():void;
}
interface SyncStore {
  enqueue(command:SyncMutation):Promise<void>;
  pending(limit:number):Promise<readonly SyncMutation[]>;
  acknowledge(ids:readonly string[]):Promise<void>;
  fail(id:string,error:SyncError):Promise<void>;
}
interface ConflictResolver<T> {
  resolve(local:T,remote:T,context:ConflictContext):Promise<ConflictResolution<T>>;
}
```

## Protocol model
Each mutation has stable client ID, resource/aggregate identity, operation, schema version, idempotency key, creation timestamp and bounded payload. Server receipts acknowledge **durably applied** mutations. Pull cursors advance only after the received batch is safely persisted locally. Cursor regression is prohibited.

## Synchronization flow
`initial sync → reference/data pages → checkpoint cursor → push dependency-ordered local mutations → durable server receipts → pull changes from cursor → persist batch → advance cursor`. Crash recovery resumes from the last committed checkpoint/ack set. All batches are bounded by item count and bytes.

## Dependency ordering
Mutations can declare dependency IDs. The push planner topologically orders ready mutations. Cycles are terminal local validation errors. A blocked dependency does not repeatedly retry unrelated commands.

## Conflict model
Each resource contract declares conflict policy. Default examples: server-wins for reference data; client-wins for offline-created inspector data where the service explicitly permits it. Protected fields require a conflict record rather than silent last-write-wins. Custom resolvers must be deterministic, versioned and tested.

## Tombstones
Deletes are represented by tombstones until the server's retention window guarantees all participating clients have observed them. Tombstones have resource ID, server version, deletion timestamp and cursor boundary. Compaction cannot remove a tombstone before policy permits.

## Reliability
At-least-once push/pull is assumed. Retries use exponential backoff + jitter and a finite budget. Poison commands enter quarantine. Offline detection pauses network work without losing queued mutations. Queue depth and payload bytes have hard limits. Duplicate pushes are expected and must be safe through server idempotency keys.

## Security
Authentication is external. Tokens are kept in SecureStorage and never inserted into mutation payloads. Tenant/principal context is explicit and server-trusted. Local queue encryption is provided by runtime/security integration where supported. No secret values are persisted in sync diagnostics.

## Storage integration
`@stackra/storage` provides the local key/value/file primitives; the sync package defines record formats and migration rules but never assumes SQLite/Hive/IndexedDB/etc. Local metadata schema has explicit version migrations.

## Files/media
Binary/media synchronization uses Files/object-upload contracts. Sync stores only file/object references and resumable transfer state. It must not implement a second object-storage client.

## Errors/recovery
`SyncProtocolError`, `SyncSchemaMismatchError`, `SyncConflictError`, `SyncQueueFullError`, `SyncAuthorizationError`, `SyncRetryExhaustedError`, `SyncCursorRegressionError`. Authorization failures pause the affected dataset. Schema-version mismatch is terminal until migration. Network errors resume automatically.

## Observability
Metrics: queue depth/bytes, pull/push latency, mutation throughput, retry count, conflict count, cursor lag and bytes transferred. Correlation IDs flow through every sync batch. Payloads are excluded from logs/traces.

## Testing
Offline/online transition, crash between persist and cursor advance, duplicate push, out-of-order pull, dependency ordering, conflict determinism, tombstone retention, queue limits, authorization failures, schema migrations, storage quota exhaustion and conformance across web/native/desktop/Worker.

## Implementation phases
1. Protocol/contracts and dataset manager.
2. Local queue/checkpoints/storage migration.
3. Pull/cursor/tombstone engine.
4. Push/idempotency/dependency ordering.
5. Conflict resolver framework.
6. Runtime connectivity/lifecycle integration.
7. Security/limits/observability.
8. Conformance, crash/failure/load tests.
9. Release/docs.

## Exit criteria
- Cursors cannot regress and crash recovery is proven.
- Duplicate mutations have exactly-once effect at the server contract level.
- Conflicts are explicit and deterministic.
- Queue, payload, retry and tombstone limits are enforced.
- Every supported dataset has a declared schema/version/conflict policy.
- No service or client creates a second synchronization engine.
