# Registry D1 Migrations

## Strategy

The Registry Worker uses **raw SQL + Wrangler D1 migrations**.

Each migration file owns **one logical schema object** and its directly
associated indexes. The seven extensible Registry metadata categories (`event`,
`workflow`, `integration`, `setting`, `feature`, `widget`, `localization`)
intentionally share one constrained `application_catalog_items` table so the
Registry does not accumulate seven nearly-identical tables. This makes schema
ownership obvious, reviewable, and easy to audit.

```text
0001_applications.sql
0002_application_versions.sql
0003_application_environments.sql
...
0010_audit_log.sql
```

## Why raw SQL instead of Knex

Knex is intentionally not used here.

The Registry runs on Cloudflare Workers and its database is Cloudflare D1
(SQLite). Wrangler already provides the deployment-time migration lifecycle.
Adding Knex would introduce a second migration abstraction and a Node-oriented
runtime dependency without providing a material operational benefit.

Raw SQL gives us:

- Native D1/SQLite semantics.
- Exact control over indexes and constraints.
- No migration framework runtime dependency.
- Direct compatibility with Wrangler.
- Smaller Worker bundles.
- Straightforward database review and incident debugging.

If a typed query/schema layer is required later, evaluate Drizzle separately; do
not replace Wrangler's migration mechanism with Knex.

## Up / Down policy

Wrangler D1 migrations are **forward-only production migrations**.

Each forward migration contains the complete `up` operation for its logical
schema object.

The corresponding `down` SQL is kept under:

`database/rollbacks/`

This is deliberate. Putting `DROP TABLE` statements inside the same SQL file
that Wrangler executes would cause destructive SQL to be part of the normal
migration stream.

Production rollback is therefore:

1. Stop/hold the affected deployment.
2. Assess foreign-key/dependency impact.
3. Restore from backup when data recovery is required, or execute an approved
   compensating migration.
4. Use the rollback SQL only under the approved database change procedure.

## Rules

- One logical table per migration file.
- Table constraints live with the table.
- Indexes required for the table's primary access patterns live with the table.
- Foreign-key dependencies determine migration order.
- Never edit an already-applied migration.
- Never add secrets to the schema.
- Destructive changes require a new migration and explicit approval.
