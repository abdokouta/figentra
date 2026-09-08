# Location Service — Migrations and Upgrades

## Database migrations

Migrations are forward-only, reviewed artifacts. Production startup must not auto-run destructive schema changes.

## Expand/contract

Schema changes use expand → deploy compatible application → backfill → switch reads/writes → contract. Large telemetry migrations use partitions/backfills rather than long blocking transactions.

## Provider upgrades

Provider adapters are independently versioned. A provider SDK upgrade must pass the shared provider contract suite before rollout.

## API versions

Breaking HTTP changes require a new version. NATS breaking changes require a new schema/subject version. Additive fields remain backward compatible.

## Rollback

Application rollback must remain compatible with the database schema already deployed. If that cannot be guaranteed, the migration is not production-ready.
