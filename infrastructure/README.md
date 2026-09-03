# Figentra Infrastructure

## Make include structure

The root `Makefile` includes **one** file — `infrastructure/infrastructure.mk`
— which fans out to every subsystem-specific `.mk` file:

```text
Makefile
   └── include infrastructure/infrastructure.mk
             ├── include infrastructure/terraform/terraform.mk
             └── include infrastructure/docker/docker.mk
```

Adding a new infrastructure subsystem (e.g. Wrangler, Pulumi) is one edit to
`infrastructure/infrastructure.mk`. Root `Makefile` never grows a second
`include`.

## Deployment source model

The root `cloud.yaml` explicitly enrolls local deployment sources. The
collector does not implicitly discover the filesystem.

```text
cloud.yaml
  │
  ├── paths: apps/* / services/* / workers/*
  └── repos: external repositories
          │
          ▼
  per-source cloud.yaml
          │
          ▼
infrastructure/scripts/collect-cloud-yaml.mjs
          │
          ▼
infrastructure/.generated/catalog.json
       ┌──┴───────────────┐
       ▼                  ▼
   Terraform             Docker
   durable infra         local Compose
```

`infrastructure/.generated/` is the machine-owned output folder. Every artefact
in it (catalog, docker-compose, tf plans) is gitignored and regenerated on
demand. Never hand-edit — the generator scripts are the only writers.

`pnpm-workspace.yaml` / pnpm workspace are package-manager concerns and do not
enroll deployment sources.

## Terraform

`infrastructure/terraform/` is the durable infrastructure authority. One
canonical root is used with three Terraform workspaces:

- `development`
- `staging`
- `production`

There are no duplicated per-environment Terraform roots. Reusable modules use
`main.tf`, `variables.tf`, and `versions.tf`; modules that expose outputs also
contain `outputs.tf`.

## Docker

`infrastructure/docker/` owns local/integration container topology:

- `docker.yaml` — local infrastructure dependencies.
- `scripts/` — Compose generation and validation.
- `postgres/` — local PostgreSQL support.
- `environments/` — canonical non-secret environment contracts.

The generated Compose file lives at `infrastructure/.generated/docker-compose.yml`
(machine-owned, gitignored). Only explicitly enrolled local deployables with
`docker.enabled: true` are included.

## Runtime boundary

The public Gateway is `services/gateway` (NestJS + Fastify). Cloudflare Workers
remain for lightweight/control-plane workloads such as Registry and the
Infrastructure Orchestrator.

## Runtime registry

The Application Registry Worker is a runtime registry and is deliberately
separate from `infrastructure/.generated/catalog.json`, which is only the
build/deploy-time catalog.
