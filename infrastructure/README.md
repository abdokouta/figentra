# Figentra Infrastructure

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
infrastructure/catalog.json
       ┌──┴───────────────┐
       ▼                  ▼
   Terraform             Docker
   durable infra         local Compose
```

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
- `docker-compose.generated.yml` — generated topology.
- `postgres/` — local PostgreSQL support.
- `environments/` — canonical non-secret environment contracts.

Only explicitly enrolled local deployables with `docker.enabled: true` are
included.

## Runtime boundary

The public Gateway is `services/gateway` (NestJS + Fastify). Cloudflare Workers
remain for lightweight/control-plane workloads such as Registry and the
Infrastructure Orchestrator.

## Runtime registry

The Application Registry Worker is a runtime registry and is deliberately
separate from `infrastructure/catalog.json`, which is only the build/deploy-time
catalog.
