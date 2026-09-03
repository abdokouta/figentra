# Figentra Engineering Standards

These standards are mandatory unless an accepted ADR explicitly defines an
exception.

## Current standards

- Architecture
- TypeScript
- package.json
- catalog.json
- testing
- documentation/TSDoc
- environments
- YAML
- NestJS services
- Cloudflare Workers
- Terraform
- security
- API contracts
- event contracts
- database

## Source-of-truth hierarchy

1. Accepted ADRs define architectural decisions.
2. Standards define cross-repository implementation rules.
3. `cloud.yaml` defines deployable metadata.
4. `catalog.json` defines reusable package metadata.
5. Terraform defines infrastructure state/configuration.
6. Generated artifacts are outputs and must not become competing sources of
   truth.

## Environment names

Canonical: `development`, `staging`, `production`

CLI aliases: `dev`, `stg`, `prd`

- [Platform Package Boundaries](./20-platform-package-boundaries.md)
