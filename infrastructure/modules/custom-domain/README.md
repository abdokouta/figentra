# `custom-domain` — infrastructure module

> **Category:** networking · **Maturity:** beta · **Version:** 1.0.0

Bring-your-own-domain + TLS provisioning. Provisions a Cloudflare custom
hostname + origin certificate for the deployable, enabling tenant-branded URLs
(e.g. academy.example.com).

## Provides

- `networking.custom-domain`
- `networking.tls`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable                | Description                      | Source         |
| ----------------------- | -------------------------------- | -------------- |
| `CUSTOM_DOMAIN_ENABLED` | Whether custom domain is active. | `literal:true` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: custom-domain
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
