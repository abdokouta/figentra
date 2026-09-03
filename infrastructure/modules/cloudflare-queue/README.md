# `cloudflare-queue` — infrastructure module

> **Category:** cloudflare · **Maturity:** stable · **Version:** 1.0.0

Cloudflare Queues binding. Provisions a message queue per deployable for async
event processing inside the Workers runtime.

## Provides

- `cloudflare.queue`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable     | Description          | Source                      |
| ------------ | -------------------- | --------------------------- |
| `QUEUE_ID`   | Cloudflare Queue ID. | `terraform_output.queue_id` |
| `QUEUE_NAME` | Queue name.          | `module.config.queue_name`  |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-queue
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
