---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/orm"
anchor_adrs: [ADR-0011, ADR-0024]
depends_on: ["@stackra/database", "@stackra/schema", "@stackra/errors", "@stackra/support"]
---
# `@stackra/orm` — implementation plan

## Purpose and boundary
`@stackra/orm` owns persistence mapping and object/unit-of-work behavior around the canonical MikroORM adapter. It owns metadata, repositories, identity maps, request-scoped EntityManagers, change tracking, filters, locking and lifecycle hooks. It does not own database pools/connections/migrations, and it never crosses service boundaries.

## Public contracts
```ts
interface Repository<T, ID> {
  findById(id:ID):Promise<T|null>;
  findOne(criteria:QueryCriteria<T>):Promise<T|null>;
  findMany(criteria:QueryCriteria<T>):Promise<readonly T[]>;
  save(entity:T):Promise<T>;
  delete(id:ID):Promise<void>;
}
interface UnitOfWork {
  run<T>(fn:(ctx:UnitOfWorkContext)=>Promise<T>):Promise<T>;
  flush():Promise<void>;
  rollback():Promise<void>;
}
interface LockManager {
  optimistic(id:unknown,expectedVersion:number):Promise<void>;
  pessimistic<T>(id:unknown,mode:'update'|'share'):Promise<T>;
}
```

## Source tree
```text
packages/orm/
├── src/core/{metadata,entities,repositories,entity-manager,identity-map,unit-of-work,lifecycle,serialization}
├── src/filters/{tenant,soft-delete,scope}
├── src/locking/{optimistic,pessimistic}
├── src/adapters/mikroorm/{adapter,metadata,configuration,index.ts}
├── src/testing/{repository-fixture,uow-fixture,concurrency-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Entity/repository rules
Entities are local persistence representations. DTOs and contracts live outside the ORM layer. Repository methods are intention-revealing and may be composed by service-domain repositories. Generic query APIs require typed criteria and allowlists; no raw SQL or uncontrolled dynamic identifiers from external input.

## Request scope and transactions
Every API/service request receives a request-scoped EntityManager. The EntityManager is obtained from `@stackra/database`'s transaction/connection boundary. Application use cases own transaction boundaries. Nested transactions use savepoints only when supported. Flush is deterministic and errors preserve causes.

## Tenant isolation
Tenant-owned entities declare a tenant key/aggregate. Required tenant filters fail closed when `tenantId` is absent. System entities must be explicitly marked global. Filter bypass requires explicit system execution context and IAM authorization. No global mutable EntityManager or tenant filter state exists.

## Concurrency
Optimistic locking/version columns are the default. Pessimistic locks are allowed only inside explicit transactions for contention-sensitive operations. Lock timeout/deadline is mandatory. Unique constraints and database isolation remain the final correctness boundary.

## Soft deletion/lifecycle
Soft deletion is opt-in per entity and always represented by an explicit filter. Hard deletion is restricted to entities whose policy allows it. Lifecycle hooks cannot make hidden network calls or start unbounded async work.

## MikroORM adapter
MikroORM is the production adapter. It consumes an explicit database client and never creates its own pool. Provider-specific APIs remain adapter-local. Metadata is validated at bootstrap; invalid mappings stop startup.

## Security
Queries are parameterized. Sort/filter field names must come from allowlists. Sensitive columns are classification-tagged and excluded from generic serialization. SQL diagnostics redact parameter values and credentials.

## Reliability
Repository/database failures are normalized to canonical errors. Transaction retry may be performed only for classified serialization/deadlock errors and restarts the full idempotent use case. No partial transaction retry is permitted.

## Observability
Metrics: query duration/count, transaction duration/rollback, lock waits/timeouts, ORM error categories and tenant-filter denials. SQL statements are normalized/redacted. OTel integration is through observability, never direct logger/provider calls.

## Testing
Metadata/mapping fixtures; repository CRUD; tenant isolation; missing-context failure; optimistic/pessimistic locking; UoW commit/rollback; savepoints; serialization errors; soft-delete; pagination; migration compatibility; real PostgreSQL conformance.

## Implementation phases
1. Core metadata/repository/UoW contracts.
2. MikroORM adapter + database integration.
3. Tenant/soft-delete filters and locking.
4. Serialization/lifecycle/observability.
5. Conformance, concurrency/failure/load tests.

## Exit criteria
- Every service declares its entities, relations, indexes, repository behavior and transaction boundaries.
- No cross-service ORM/entity imports exist.
- Missing tenant context cannot read tenant rows.
- Connection/pool/migration ownership remains exclusively in `@stackra/database`.
