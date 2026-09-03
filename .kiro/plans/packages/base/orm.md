---
status: canonical
component: package
package: "@stackra/orm"
---
# `@stackra/orm` — implementation plan

MikroORM-backed persistence abstraction owning metadata, repositories, unit-of-work, identity map, locking, filters and entity lifecycle. It does not own database connection/migration infrastructure.

## Layout/API
`metadata`, `entities`, `repositories`, `unit-of-work`, `filters`, `locking`, `adapters`, `testing`, `index`. Expose repository/UoW interfaces and MikroORM adapter tokens.

## Tenant/concurrency
Tenant filters are explicit and fail closed where required; optimistic/pessimistic locking semantics are documented per repository. No hidden global entity manager in worker runtimes.

## Reliability/testing
Request-scoped entity managers, transaction propagation, rollback, concurrent update tests, query/filter isolation, migration compatibility and adapter conformance.

## Exit criteria
Services use ORM for mapping/persistence behavior while `@stackra/database` remains the sole owner of connections, lifecycle and migrations.
