# `redis-cache` — infrastructure module

> **Category:** storage · **Maturity:** stable · **Version:** 1.0.0

Redis cache and session store. Provisions a Redis instance (Upstash /
ElastiCache in prod, Docker locally) for caching, rate limiting, and ephemeral
state.

## Provides

- `cache.redis`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable    | Description           | Source                       |
| ----------- | --------------------- | ---------------------------- |
| `REDIS_URL` | Redis connection URL. | `terraform_output.redis_url` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: redis-cache
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
