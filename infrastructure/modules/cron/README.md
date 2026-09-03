# `cron` — infrastructure module

> **Category:** background · **Maturity:** beta · **Version:** 1.0.0

Scheduled job execution. Provisions Cloudflare Cron Triggers (Workers) or system-level cron (containers). Each job declares a crontab schedule and a target HTTP endpoint the scheduler hits.

## Provides

- `background.cron`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** wrangler.jsonc.tmpl

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `CRON_JOBS` | JSON-encoded job definitions. | `module.config.jobs` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: cron
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
