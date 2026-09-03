# Figentra Infrastructure Audit

## Scope

This audit covers the repository infrastructure contract, canonical
environments, Docker topology, Terraform structure, CI/CD matrices, and
reproducibility controls.

## Canonical environment standard

The repository accepts exactly:

- `development`
- `staging`
- `production`

The only environment source of truth is `infrastructure/environments/*.yaml`.

External provider identifiers are mappings, not alternate repository
environments:

| Canonical   | Doppler | Wrangler      | Terraform workspace | Local Compose |
| ----------- | ------- | ------------- | ------------------- | ------------- |
| development | `dev`   | `development` | `development`       | enabled       |
| staging     | `stg`   | `staging`     | `staging`           | enabled       |
| production  | `prd`   | `production`  | `production`        | prohibited    |

Duplicate Docker/Terraform environment directories are prohibited.

## Docker contract

Every Docker-enabled catalog entry must have:

- `container.port`
- `container.health_path`
- matching `docker.container_port`
- matching `docker.health_path`
- an existing Dockerfile
- a generated Compose service
- a generated healthcheck

All 17 Docker-enabled services are represented in the CI package/deploy
matrices.

Production is never generated as local Compose.

## Terraform contract

Terraform modules are recursively discovered under
`infrastructure/terraform/modules`. Each module containing `main.tf` must also
contain `variables.tf` and `versions.tf`.

Terraform lifecycle commands select the canonical environment workspace before
state, plan, apply, or destroy operations. Production apply/destroy require
explicit confirmation.

## CI contract

CI uses pnpm 11.24.0 because the repository uses the pnpm `catalog:` protocol.
CI must use `pnpm install --frozen-lockfile` and cache `pnpm-lock.yaml`.

Doppler aliases remain external mappings (`dev`, `stg`, `prd`) and are
explicitly mapped to canonical environments.

The CI matrices are checked against `infrastructure/.generated/catalog.json` and
the actual Worker set.

## Reproducibility gate

`pnpm-lock.yaml` is mandatory. It must be generated and committed from a
networked environment before CI or Docker builds can pass the frozen-install
gate.

The current inspection environment has no package-registry/Docker/Terraform
network/tooling access, so lockfile resolution and runtime execution are
intentionally not fabricated.

## Runtime gates

Required before production readiness:

1. `pnpm install --frozen-lockfile`
2. infrastructure contract
3. CI contract
4. Docker Compose generation and config validation
5. all 17 Docker image builds
6. development stack startup and health checks
7. staging image/stack validation where applicable
8. `terraform fmt -check -recursive`
9. `terraform init -backend=false`
10. `terraform validate`
11. environment-specific provider-backed plans
12. staging deployment and smoke tests
13. production plan review and controlled deployment rehearsal
