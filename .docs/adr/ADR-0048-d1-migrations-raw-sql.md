# ADR-0048 — D1 Migration Strategy: Raw SQL + Wrangler

## Status

Accepted.

## Context

Figentra Workers use Cloudflare D1. The previous registry schema was a
monolithic SQL migration containing multiple logical tables, while the team
requires clear ownership, explicit indexes, and controlled rollback semantics.

Knex was considered as a migration abstraction.

## Decision

Use **raw SQL migrations executed by Wrangler D1**.

Every logical table gets its own numbered forward migration. Table constraints
and directly related indexes remain in that migration.

Example:

```text
0001_applications.sql
0002_application_versions.sql
0003_application_environments.sql
...
```

Rollback SQL is stored separately under:

```text
database/rollbacks/
```

Production rollback is forward/compensating-migration or backup/restore based,
not an implicit `down` operation in the normal Wrangler migration stream.

## Why not Knex

Knex adds a second migration lifecycle to a Worker environment that already has
a first-class Wrangler/D1 migration lifecycle. It also adds unnecessary
runtime/tooling coupling for SQLite/D1.

Raw SQL provides exact SQLite/D1 semantics, lower complexity, smaller runtime
surface, and direct operational visibility.

A future typed SQL layer such as Drizzle may be evaluated for query/schema
typing, but it must not replace Wrangler's deployment migration ownership
without a new ADR.

## Consequences

### Positive

- One schema object per migration.
- Clear review ownership.
- Native D1 semantics.
- No Knex runtime dependency.
- Deterministic Wrangler deployments.
- Explicit rollback artifacts.
- Easy database incident debugging.

### Negative

- No framework-generated `down` lifecycle.
- Operators must follow approved rollback/change procedures.
- Application code must not assume arbitrary schema rollback is safe.

## Rules

1. Never edit an applied migration.
2. Never put destructive rollback SQL in the forward migration stream.
3. Every migration must include file-level documentation.
4. Every table migration must define required indexes in the same migration.
5. Foreign-key dependency order must be reflected in migration numbering.
6. Destructive schema changes require a new migration and approval.
