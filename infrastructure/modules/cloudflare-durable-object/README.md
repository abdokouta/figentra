# `cloudflare-durable-object` — infrastructure module

> **Category:** cloudflare · **Maturity:** beta · **Version:** 1.0.0

Cloudflare Durable Objects binding. Provisions a DO namespace for stateful,
globally-unique singleton actors inside the Workers runtime.

## Provides

- `cloudflare.durable-object`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable          | Description                  | Source                             |
| ----------------- | ---------------------------- | ---------------------------------- |
| `DO_NAMESPACE_ID` | Durable Object namespace ID. | `terraform_output.do_namespace_id` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-durable-object
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
