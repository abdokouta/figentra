# `betterstack-uptime` — infrastructure module

> **Category:** observability · **Maturity:** stable · **Version:** 1.0.0

Better Stack uptime monitoring. Provisions an uptime monitor that probes the
deployable's health endpoint and alerts on downtime.

## Provides

- `observability.uptime`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Usage in `cloud.yaml`

```yaml
modules:
  - use: betterstack-uptime
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
