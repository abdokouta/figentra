# ADR-0045 — Infrastructure Directory Boundaries

## Status

Accepted.

## Decision

Split infrastructure by execution/provisioning concern:

- `infrastructure/docker` owns Docker, Compose, PostgreSQL container support,
  Docker environments, and Docker generation scripts.
- `infrastructure/terraform` owns Terraform source, modules, Terraform
  environments and Terraform scripts.
- root `scripts/` is reserved for repository-wide automation.

The generated Docker Compose output is
`infrastructure/docker/docker-compose.generated.yml`.

`catalog.json` remains a reusable package metadata contract and must not be
repurposed for Docker infrastructure. Docker uses `catalog.yaml` for its
generation contract.

## Consequences

The repository has a clear ownership boundary between container topology and
cloud provisioning, while both can consume the deployable `cloud.yaml`
contracts.
