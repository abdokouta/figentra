# `cloudflare-d1` — infrastructure module

> **Category:** cloudflare · **Maturity:** stable · **Version:** 1.0.0

Cloudflare D1 SQLite database binding. Provisions a D1 database per deployable
and injects the binding name + database ID into the Worker runtime.

## Provides

- `cloudflare.d1`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable           | Description                  | Source                            |
| ------------------ | ---------------------------- | --------------------------------- |
| `D1_DATABASE_ID`   | Cloudflare D1 database UUID. | `terraform_output.d1_database_id` |
| `D1_DATABASE_NAME` | D1 database name.            | `module.config.database_name`     |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-d1
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
