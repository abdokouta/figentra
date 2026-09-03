# `resend-email` — infrastructure module

> **Category:** third-party · **Maturity:** beta · **Version:** 1.0.0

Resend transactional email integration. Configures the Resend API key and default sender domain for the deployable to send transactional emails (password resets, notifications, receipts).

## Provides

- `email.transactional`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `RESEND_API_KEY` | Resend API key (from Doppler). | `terraform_output.resend_api_key` |
| `EMAIL_FROM_DOMAIN` | Default sender domain. | `module.config.from_domain` |
| `EMAIL_FROM_NAME` | Default sender display name. | `module.config.from_name` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: resend-email
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
