---
status: canonical
component: package
package: "@stackra/database"
owner: platform
---
# `@stackra/database` — implementation-complete plan

## Purpose and boundary
Own connection lifecycle, pools, transactions, read/write routing, migration execution, health/readiness and database driver adapters. ORM mapping is owned by `@stackra/orm`; domain repositories remain service-owned.

## Public API
```ts
interface DatabaseManager { connect():Promise<void>; disconnect():Promise<void>; transaction<T>(fn:(tx:Transaction)=>Promise<T>):Promise<T>; health():Promise<DatabaseHealth>; }
interface Transaction { id:string; query<T>(sql:string, params:readonly unknown[]):Promise<readonly T[]>; commit():Promise<void>; rollback():Promise<void> }
interface MigrationRunner { status():Promise<MigrationStatus>; migrate():Promise<void>; rollback(target?:string):Promise<void> }
```
Driver contracts cover connect/query/begin/commit/rollback/drain and capability discovery. SQL is never built from untrusted identifiers.

## Runtime/layout
`src/core`, `src/drivers`, `src/pool`, `src/transactions`, `src/migrations`, `src/health`, `src/routing`, `src/testing`, `src/index.ts`. MikroORM receives an explicit connection adapter and never creates a hidden application-global connection.

## Production database
PostgreSQL is the canonical relational store. TLS, bounded pool size, acquisition timeout, statement timeout and idle timeout are mandatory. Read replicas are opt-in; stale-read semantics are explicit at call sites. Writes always use the authoritative writer.

## Transactions
Transaction callbacks run on one connection. Nested transactions use savepoints only when supported. Commit/rollback is idempotent from the caller perspective. No automatic retry occurs around arbitrary transactions; retry is allowed only after classifying the failure and restarting the complete idempotent unit of work.

## Migrations
Migrations are versioned, checksum-verified and serialized with an advisory/metadata lock. Expand/contract is required for online breaking schema changes. Destructive changes require a separate migration after application compatibility is proven. Migration state is observable.

## Security/tenancy
Least-privilege service credentials, secret references, TLS verification, parameterized queries and redacted diagnostics. Tenant isolation is enforced by the owning service/ORM model; this package provides transaction primitives and cannot infer tenant ownership.

## Reliability
Connection failures trigger bounded reconnect/backoff. Pool exhaustion returns a typed dependency/timeout error. Shutdown stops new work, drains active operations, then closes connections within a deadline.

## Testing
Driver conformance, rollback, deadlock/serialization failures, pool exhaustion, replica routing, migration locking, startup/readiness, graceful drain and upgrade/downgrade compatibility. Every production driver must pass the same suite.

## Completion criteria
No service creates raw pools outside this package; migrations are executable and tested; health distinguishes process-up from database-ready; connection and transaction limits are explicit in every production environment.