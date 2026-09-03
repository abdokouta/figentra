# `cloudflare-r2` — infrastructure module

> **Category:** cloudflare · **Maturity:** stable · **Version:** 1.0.0

Cloudflare R2 object-storage binding. Provisions an R2 bucket per deployable for
file/blob storage compatible with the S3 API.

## Provides

- `cloudflare.r2`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable         | Description                            | Source                           |
| ---------------- | -------------------------------------- | -------------------------------- |
| `R2_BUCKET_NAME` | R2 bucket name.                        | `module.config.bucket_name`      |
| `R2_ACCOUNT_ID`  | Cloudflare account hosting the bucket. | `terraform_output.r2_account_id` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cloudflare-r2
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
