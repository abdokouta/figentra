---
status: canonical
component: package
package: "@stackra/orm"
owner: platform
---
# `@stackra/orm` — implementation-complete plan

## Purpose
Provide typed persistence mapping around MikroORM while keeping database lifecycle in `@stackra/database` and business rules in service domains.

## Responsibilities
Entity metadata, identity map, request-scoped EntityManager, repositories, unit-of-work, change tracking, optimistic/pessimistic locking, soft-delete filters, tenant filters, lifecycle hooks and transaction participation.

## Layout
`src/metadata`, `src/entities`, `src/repositories`, `src/unit-of-work`, `src/filters`, `src/locking`, `src/adapters/mikroorm`, `src/testing`, `src/index.ts`.

## Contracts
```ts
interface Repository<T, ID> { findById(id:ID):Promise<T|null>; save(entity:T):Promise<T>; delete(id:ID):Promise<void> }
interface UnitOfWork { run<T>(fn:()=>Promise<T>):Promise<T>; flush():Promise<void>; rollback():Promise<void> }
interface LockManager { optimistic<T>(entity:T, version:number):Promise<void>; pessimistic<T>(id:unknown):Promise<T> }
```
Repositories may expose domain-specific methods in services, but generic repository behavior remains consistent. Entities are persistence models, not cross-service DTOs.

## Tenant isolation
Tenant-owned entities carry an explicit tenant key or belong to a tenant-scoped aggregate. Tenant filtering is fail-closed when context is required. A missing tenant context cannot silently execute an unrestricted query. Cross-tenant administrative operations require an explicit system context and IAM authorization.

## Concurrency
Optimistic version columns are the default for mutable aggregates. Pessimistic locks are reserved for contention-sensitive critical sections and require transaction scope. Unique constraints and database isolation remain the final correctness boundary.

## Transactions/lifecycle
The request scope obtains one EntityManager. Transaction boundaries are owned by application use cases and database transaction primitives. Flush failures preserve causal errors. Entity hooks cannot perform hidden network calls or unbounded work.

## Security
Parameterized queries, safe sort/filter allowlists, no raw SQL from untrusted input, bounded result sets and redacted query diagnostics. Sensitive columns are explicitly classified and excluded from generic serialization.

## Testing
Mapping fixtures, repository behavior, transaction rollback, tenant-filter isolation, concurrent writes, lock conflicts, soft-delete behavior, pagination, migration compatibility and provider conformance. Test suites must prove that omitted tenant context cannot read tenant data.

## Completion criteria
Every service persistence module declares entities, relations, indexes, repositories, transaction boundaries and concurrency semantics. No global EntityManager, cross-service entity import or implicit tenant filter is permitted.