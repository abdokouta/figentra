# `firebase-fcm` — infrastructure module

> **Category:** third-party · **Maturity:** stable · **Version:** 1.0.0

Firebase Cloud Messaging for push notifications. Provisions a Firebase project + enables FCM; injects the server key and project ID for the mobile backend to send push tokens.

## Provides

- `push.fcm`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `FIREBASE_PROJECT_ID` | GCP project ID. | `module.config.project_id` |
| `FCM_SERVER_KEY` | FCM server key (from Doppler). | `terraform_output.fcm_server_key` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: firebase-fcm
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
