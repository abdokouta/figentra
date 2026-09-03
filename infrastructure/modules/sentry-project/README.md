# `sentry-project` — infrastructure module

> **Category:** observability · **Maturity:** stable · **Version:** 1.0.0

Sentry error tracking + performance monitoring project. Provisions a Sentry project per deployable per environment and injects the DSN.

## Provides

- `observability.sentry`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `SENTRY_DSN` | Sentry Data Source Name. | `terraform_output.sentry_dsn` |
| `SENTRY_ENVIRONMENT` | Sentry environment tag. | `terraform_output.sentry_environment` |
| `SENTRY_TRACES_SAMPLE_RATE` | Traces sample rate. | `module.config.traces_sample_rate` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: sentry-project
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
