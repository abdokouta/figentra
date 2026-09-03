# Infrastructure Layout Standard

## Decision

Infrastructure is split into three top-level concerns:

```text
infrastructure/
├── .generated/                 # machine-owned; gitignored (README is tracked)
│   ├── catalog.json            # emitted by collect-cloud-yaml.mjs
│   ├── docker-compose.yml      # emitted by generate-compose.mjs
│   └── terraform/plans/        # tfplan-<env> files emitted by tf-plan
│
├── docker/
│   ├── environments/
│   ├── postgres/
│   │   └── migrations/
│   ├── scripts/
│   └── catalog.yaml
│
└── terraform/
    ├── modules/
    ├── environments/
    ├── scripts/
    ├── main.tf
    ├── variables.tf
    ├── versions.tf
    └── outputs.tf
```

### Docker

Docker owns local/integration containerization, PostgreSQL container support,
Compose generation and Docker-specific scripts.

### Terraform

Terraform owns durable cloud infrastructure provisioning and Terraform-specific
automation scripts.

## Generated Compose

The generated Compose file is:

`infrastructure/.generated/docker-compose.yml`

It must be treated as generated output and must not become a competing source of
truth. Every artefact under `infrastructure/.generated/` is machine-owned +
gitignored; see
[`infrastructure/.generated/README.md`](../../infrastructure/.generated/README.md).

## Catalog naming

Do not use `infrastructure/.generated/catalog.json` for Docker Compose metadata.
`catalog.json` at the workspace-package tier is reserved for reusable Stackra
package metadata; the infrastructure catalog inside `.generated/` is a
build-time deployment map.

Docker infrastructure uses `infrastructure/docker/catalog.yaml` because it is an
infrastructure generation contract rather than a publishable package catalog.

## Scripts

Docker scripts belong in:

`infrastructure/docker/scripts/`

Terraform scripts belong in:

`infrastructure/terraform/scripts/`

Repository-wide scripts remain under:

`scripts/`

## .gitkeep

`.gitkeep` is allowed only for intentionally empty directories. Once a directory
contains a real file, its `.gitkeep` must be removed.
