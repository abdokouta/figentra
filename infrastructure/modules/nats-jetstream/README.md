# `nats-jetstream` — infrastructure module

> **Category:** messaging · **Maturity:** stable · **Version:** 1.0.0

NATS JetStream event bus. Provisions streams + consumers for internal async messaging between services per ADR-0058. Local dev runs NATS in Docker.

## Provides

- `messaging.nats`
- `messaging.jetstream`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `NATS_URL` | NATS server connection URL. | `terraform_output.nats_url` |
| `NATS_CONSUMER_GROUP` | Durable consumer group. | `module.config.consumer_group` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: nats-jetstream
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
