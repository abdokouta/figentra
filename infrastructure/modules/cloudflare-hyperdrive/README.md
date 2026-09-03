# `cloudflare-hyperdrive` — infrastructure module

> **Category:** cloudflare · **Maturity:** beta · **Version:** 1.0.0

Cloudflare Hyperdrive connection-pool binding. Provisions a Hyperdrive
configuration that accelerates TCP connections from Workers to external
databases (Postgres, MySQL).

## Provides

- `cloudflare.hyperdrive`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable        | Description                  | Source                           |
| --------------- | ---------------------------- | -------------------------------- |
| `HYPERDRIVE_ID` | Hyperdrive configuration ID. | `terraform_output.hyperdrive_id` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-hyperdrive
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
