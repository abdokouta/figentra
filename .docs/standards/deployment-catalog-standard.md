# Deployment Catalog Standard

## Purpose

Figentra deployables self-register through their local `cloud.yaml` manifest.

The shared collector:

`infrastructure/scripts/collect-cloud-yaml.mjs`

discovers:

```text
apps/*/cloud.yaml
workers/*/cloud.yaml
services/*/cloud.yaml
```

and emits:

`infrastructure/.generated/catalog.json`

The `infrastructure/.generated/` folder is machine-owned + gitignored — every
artefact inside is regenerated on demand by an infrastructure script and is
never hand-edited or committed. See
[`infrastructure/.generated/README.md`](../../infrastructure/.generated/README.md).

## Consumers

The generated catalog is consumed by:

- Terraform infrastructure generation.
- Docker Compose generation.
- CI/deployment validation.
- Future deployment/orchestration tooling.

## Rules

- Never manually edit `infrastructure/.generated/catalog.json`.
- Never create `terraform/deployables/<service>` merely because a deployable
  exists.
- Terraform modules model infrastructure capabilities, not applications.
- Docker generation consumes the same normalized catalog.
- Runtime Application Registry remains separate from this build/deployment
  catalog.
- External repositories may be represented in the catalog for Terraform, but
  Docker generation only materializes local deployables.
