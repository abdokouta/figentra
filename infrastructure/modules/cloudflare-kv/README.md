# `cloudflare-kv` — infrastructure module

> **Category:** cloudflare · **Maturity:** stable · **Version:** 1.0.0

Cloudflare Workers KV namespace binding. Provisions a KV namespace per
deployable and injects the namespace ID into the Worker runtime.

## Provides

- `cloudflare.kv`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable            | Description                   | Source                             |
| ------------------- | ----------------------------- | ---------------------------------- |
| `KV_NAMESPACE_ID`   | Cloudflare KV namespace UUID. | `terraform_output.kv_namespace_id` |
| `KV_NAMESPACE_NAME` | KV namespace name.            | `module.config.namespace_name`     |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-kv
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
