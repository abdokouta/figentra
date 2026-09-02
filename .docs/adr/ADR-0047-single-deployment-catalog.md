# ADR-0047 — Single Deployment Catalog

## Status

Accepted.

## Decision

Figentra uses one generated deployment catalog at:

`infrastructure/catalog.json`

It is produced by `infrastructure/scripts/collect-cloud-yaml.mjs`.

Terraform and Docker consume this same catalog. No subsystem maintains a
second manually authored list of deployables.

The generated Docker Compose file is:

`infrastructure/docker/docker-compose.generated.yml`

and remains an output artifact, not a source of truth.

Terraform modules represent infrastructure capabilities rather than individual
services or applications.

## Consequences

Adding a deployable requires its own `cloud.yaml`; no second registration step
is required for infrastructure generation. This eliminates Terraform/Docker
discovery drift.
