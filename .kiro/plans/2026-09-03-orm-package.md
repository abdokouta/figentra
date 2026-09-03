---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/orm` — enterprise persistence mapping and unit-of-work

**Status:** Planned  
**Anchor ADRs:** ADR-0011, ADR-0013, ADR-0024, ADR-0090, ADR-0091  
**Reference:** `.ref/packages/orm/` and existing database plan  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/database`, `@stackra/support`, `@stackra/events`  
**Design effort:** 18 days across 9 phases

## Purpose

The ORM owns entity metadata, mapping, repositories, identity maps, unit-of-work semantics, persistence events, optimistic locking, soft-delete policy and tenant filters. It does NOT own connection creation, pooling, credentials, migrations or transport.

## Non-goals

- Database connections or pool management.
- HTTP/GraphQL concerns.
- Business transactions across services.
- Vendor-specific APIs in domain code.

## Manager pattern

No generic driver Manager. `OrmManager` is a runtime coordinator over the active `IDatabaseConnection` and metadata registry; the database package owns the actual connection drivers.

## Subpath layout

```text
packages/orm/
├── src/core/
│   ├── orm.module.ts
│   ├── metadata/             # entity/field/relation metadata
│   ├── repositories/         # repository base + unit-of-work
│   ├── identity-map/
│   ├── query/                # ORM-neutral query specification
│   ├── events/               # persistence lifecycle events
│   ├── tenancy/              # tenant filters
│   ├── locking/              # optimistic/pessimistic lock policy
│   ├── decorators/           # @Entity, @Column, @Relation
│   ├── errors/
│   └── index.ts
├── src/mikro-orm/             # MikroORM adapter
├── src/nestjs/                # DynamicModule + request UoW
├── src/worker/                # Worker-safe adapter boundary
├── src/testing/               # disposable UoW + fixtures
└── __tests__/
```

## Contracts split

`@stackra/contracts/orm` owns `IEntityManager`, `IRepository`, `IUnitOfWork`, `IEntityMetadata`, `IQuerySpecification`, `ITransaction`, lock types and `ORM_MANAGER`/`ENTITY_MANAGER` tokens. Implementations stay here or in `/mikro-orm`.

## Public API — locked

```ts
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(spec: IQuerySpecification<T>): Promise<T | null>;
  findMany(spec: IQuerySpecification<T>): Promise<readonly T[]>;
  save(entity: T): Promise<T>;
  delete(entity: T): Promise<void>;
}

interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  transactional<T>(fn: () => Promise<T>): Promise<T>;
}
```

Repository methods MUST execute through the injected entity manager. No repository may open a database connection directly.

## Core architecture

Entity metadata is immutable after bootstrap. Discovery finds decorated entities; `MetadataRegistry` stores them; `EntityManagerFactory` constructs the runtime mapper; repositories operate against the manager. A request-scoped UoW is used for HTTP/Nest transactions where configured. Workers use explicit execution-scoped UoWs.

MikroORM integration maps repositories and query specifications to MikroORM APIs. `findAndCount()` is used for offset pagination; cursor queries use explicit stable `orderBy`; `getResultAndCount()` is reserved for QueryBuilder cases. ORM collections are never confused with pagination result objects.

## Configuration / validation

Validate entity names, table names, primary keys, relation ownership, cascade policy, tenant filter requirements, optimistic-lock fields and naming strategy at bootstrap. Production rejects auto-schema synchronization. Migration execution belongs to `@stackra/database`.

## Discovery / registry

Entity discovery uses the canonical `IDiscoveryService`; `EntityMetadataRegistry` indexes metadata; relation resolution runs after all entities are discovered. Duplicate entity/table identities fail fast with a deterministic diagnostic.

## Security / tenancy

Tenant filters are mandatory for entities declared tenant-scoped. A repository cannot bypass tenant scope through ordinary APIs. Administrative bypass requires an explicit privileged context. Query parameters are bound, raw SQL is isolated to a reviewed adapter API, and audit hooks capture privileged persistence operations.

## Errors / recovery

Database errors are normalized through `@stackra/errors`. Serialization, unique-key, optimistic-lock and deadlock failures map to stable codes. Transaction retry is allowed only for known transient/deadlock classes and must use bounded attempts with jitter; application callbacks are never blindly replayed outside the transaction boundary.

## Observability

Expose transaction duration, query count, slow-query count, rollback count, optimistic-lock conflicts and connection wait time. Trace spans carry request/tenant/correlation identifiers without recording SQL parameters that may contain secrets or PII.

## Persistence / migrations / compatibility

ORM metadata is the source for mapping only. Schema migration files are owned by `@stackra/database`. Entity changes require migration compatibility analysis. Dual-read/write is permitted only as an explicit migration phase with an expiry date; no permanent compatibility layer is allowed.

## Testing / conformance

Unit tests cover metadata, identity map, relation resolution and query specifications. Integration tests run against disposable PostgreSQL/SQLite implementations through `@stackra/database`. Contract tests cover repositories, transactions, optimistic locking, tenant isolation and rollback. MikroORM conformance is mandatory.

## Dependencies / exports / versioning

Core depends only on contracts/container/support/database abstractions. MikroORM and Nest are optional peers under dedicated subpaths. No database vendor package is exposed from root exports. Public API changes require Changesets.

## Phases

1. **Contracts/scaffold (2d):** interfaces, tokens, metadata model, exports.
2. **Metadata/discovery (2d):** decorators, registry and diagnostics.
3. **Repository/UoW (3d):** identity map, transactions and lifecycle.
4. **MikroORM adapter (3d):** mapping, repositories and query translation.
5. **Tenancy/locking (2d):** filters, optimistic versioning and audit hooks.
6. **Nest/Worker runtime (2d):** request/execution scoped UoW.
7. **Failure/observability (1d):** normalization, metrics and tracing.
8. **Conformance (2d):** disposable DB and adapter suite.
9. **Docs/release (1d):** migration guide and Changeset.

## Exit criteria

- No ORM code owns a database connection lifecycle.
- Tenant-scoped repositories cannot silently bypass tenant filters.
- Transactions roll back deterministically on every failure path.
- MikroORM passes the complete ORM contract suite.
- Migration responsibilities are unambiguous and documented.

## Cross-references

- `2026-09-03-database-package.md`
- `2026-09-03-pagination-package.md`
- `2026-09-03-state-machine-package.md`
- ADR-0011, ADR-0013, ADR-0024, ADR-0090, ADR-0091.
