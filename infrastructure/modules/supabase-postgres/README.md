# `supabase-postgres` — infrastructure module

> **Category:** storage · **Maturity:** stable · **Version:** 1.0.0

Supabase PostgreSQL database. Provisions a Supabase project (or reuses an
existing one) and injects the connection string, service-role key, and anon key
into the deployable runtime.

## Provides

- `database.postgres`
- `supabase.project`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable                    | Description                              | Source                                       |
| --------------------------- | ---------------------------------------- | -------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string (pooler).   | `terraform_output.database_url`              |
| `DIRECT_DATABASE_URL`       | Direct connection string (migrations).   | `terraform_output.direct_database_url`       |
| `SUPABASE_URL`              | Supabase project API URL.                | `terraform_output.supabase_url`              |
| `SUPABASE_ANON_KEY`         | Supabase public anon key.                | `terraform_output.supabase_anon_key`         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only). | `terraform_output.supabase_service_role_key` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: supabase-postgres
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) —
  module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md)
  — authorising plan.
