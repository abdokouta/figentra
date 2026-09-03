# `twilio-sms` — infrastructure module

> **Category:** third-party · **Maturity:** beta · **Version:** 1.0.0

Twilio SMS messaging integration. Configures the Twilio account SID, auth token,
and default sender number for transactional SMS (OTP codes, notifications,
alerts).

## Provides

- `sms.twilio`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable             | Description                        | Source                                |
| -------------------- | ---------------------------------- | ------------------------------------- |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (from Doppler). | `terraform_output.twilio_account_sid` |
| `TWILIO_AUTH_TOKEN`  | Twilio auth token (from Doppler).  | `terraform_output.twilio_auth_token`  |
| `TWILIO_FROM_NUMBER` | Default sender number.             | `module.config.from_number`           |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: twilio-sms
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
