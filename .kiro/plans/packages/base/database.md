---
status: canonical
component: package
package: "@stackra/database"
---
# `@stackra/database` — implementation plan

Own database connection lifecycle, pools, transactions, read/write routing, health, migration execution and database driver adapters. ORM concerns remain in `@stackra/orm`.

## API
`DatabaseManager`, `DatabaseConnection`, transaction context, health/readiness, migration runner, read/write client selection and lifecycle hooks. Explicit provider/driver tokens.

## Reliability
Pool bounds/timeouts, transaction cancellation, retry policy only outside active non-idempotent transactions, connection draining and migration locking.

## Security/tenancy
Least-privilege credentials, TLS, secret references, no SQL/credential leakage in logs. Tenant isolation is enforced by service/ORM policies; database package provides primitives, not business policy.

## Testing
Driver conformance, transaction rollback, pool exhaustion, health degradation, migration locking/upgrade and shutdown.

## Exit criteria
All services have one database lifecycle abstraction and ORM never owns connection policy.
