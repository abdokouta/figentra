# `meilisearch` — infrastructure module

> **Category:** search · **Maturity:** beta · **Version:** 1.0.0

Meilisearch full-text search engine. Provisions a Meilisearch instance (managed cloud in prod, Docker locally) and injects the host URL + API key.

## Provides

- `search.meilisearch`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** compose.yaml
- **wrangler:** n/a

## Environment variables

| Variable | Description | Source |
| -------- | ----------- | ------ |
| `MEILISEARCH_HOST` | Meilisearch instance URL. | `terraform_output.meilisearch_host` |
| `MEILISEARCH_API_KEY` | Admin API key (from Doppler). | `terraform_output.meilisearch_api_key` |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: meilisearch
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) — module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md) — authorising plan.
