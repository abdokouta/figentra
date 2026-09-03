---
status: canonical
component: package
package: "@stackra/sync"
owner: platform
---
# `@stackra/sync` — implementation-complete plan

## Purpose
Reusable offline-first synchronization primitives for clients. Sync coordinates local state, outbound mutations, server changes and retry/conflict handling; it does not own any business entity or database.

## API
```ts
interface SyncEngine { initialSync():Promise<SyncResult>; pull(cursor?:string):Promise<SyncResult>; push():Promise<PushResult>; run():Promise<SyncResult>; pause():void; resume():void }
interface SyncStore { enqueue(command:SyncCommand):Promise<void>; pending(limit:number):Promise<readonly SyncCommand[]>; acknowledge(ids:readonly string[]):Promise<void>; fail(id:string,error:SyncError):Promise<void> }
interface ConflictResolver<T> { resolve(local:T,remote:T,context:ConflictContext):Promise<ConflictResolution<T>> }
```

## Data model
The package defines `SyncCursor`, `SyncCommand`, `SyncReceipt`, `SyncError`, `ConflictContext` and `SyncState`. Commands have stable IDs, aggregate/resource identity, operation, payload, createdAt, attempt count and idempotency key. Media synchronization is delegated to Files and uses resumable/object-upload contracts.

## Flow
Initial sync establishes a server cursor and downloads bounded reference/data pages. Push sends commands in dependency order. Server receipts acknowledge durable mutations. Pull advances the cursor only after a batch is safely persisted locally. Crash recovery resumes from the last committed cursor/ack set.

## Conflicts
Default policy is explicit per resource: server-wins for reference data and client-wins for inspector-created/offline-owned mutations where the service contract allows it. Conflict resolution must be deterministic and auditable. Silent last-write-wins is forbidden for business-critical resources.

## Reliability
Exponential backoff with jitter, bounded retries, offline detection, batching, maximum queue size and poison-command quarantine. Duplicate pushes are expected; server commands require idempotency keys. A permanently rejected command remains inspectable until an explicit resolution policy removes it.

## Security
Local credentials are held through SecureStorage. Tenant and principal context are explicit. Payload encryption is runtime/app responsibility using `@stackra/security`. No sync log contains access tokens or secret material.

## Testing
Offline/online transitions, crash recovery, duplicate commands, ordering dependencies, cursor atomicity, conflicts, poison messages, retry exhaustion, queue limits and large-batch memory behavior. Conformance fixtures are shared across web/native/desktop clients.

## Completion criteria
Every supported resource has a sync contract, cursor semantics, mutation idempotency, conflict policy and retention rule; no service invents a second offline queue or synchronization engine.