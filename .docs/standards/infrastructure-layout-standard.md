# Infrastructure Layout Standard

## Decision

Infrastructure is split into two top-level concerns:

```text
infrastructure/
├── docker/
│   ├── environments/
│   ├── postgres/
│   │   └── migrations/
│   ├── scripts/
│   ├── catalog.yaml
│   └── docker-compose.generated.yml
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

`infrastructure/docker/docker-compose.generated.yml`

It must be treated as generated output and must not become a competing source
of truth.

## Catalog naming

Do not use `infrastructure/catalog.json` for Docker Compose metadata.
`catalog.json` is reserved for reusable Stackra package metadata.

Docker infrastructure uses `infrastructure/docker/catalog.yaml` because it is
an infrastructure generation contract rather than a publishable package
catalog.

## Scripts

Docker scripts belong in:

`infrastructure/docker/scripts/`

Terraform scripts belong in:

`infrastructure/terraform/scripts/`

Repository-wide scripts remain under:

`scripts/`

## .gitkeep

`.gitkeep` is allowed only for intentionally empty directories. Once a
directory contains a real file, its `.gitkeep` must be removed.
