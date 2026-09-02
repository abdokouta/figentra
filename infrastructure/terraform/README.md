# Figentra Terraform Infrastructure

Terraform is the durable infrastructure authority. The canonical Terraform root
is `infrastructure/terraform`; environments are isolated by Terraform workspace.

## Source pipeline

1. Root `cloud.yaml` explicitly enrolls local deployment paths and external repos.
2. Each enrolled source must provide its own `cloud.yaml`.
3. `pnpm run catalog` produces `infrastructure/catalog.json`.
4. Terraform decodes the generated catalog and composes reusable modules.
5. Terraform outputs durable resource identifiers consumed by Worker/Wrangler
   rendering and deployment automation.

## Canonical environments

Only these names are valid:

- `development`
- `staging`
- `production`

No `dev`, `stg`, or `prd` aliases are accepted by the Terraform operator.

## Commands

```bash
make catalog
make -C infrastructure/terraform tf-init ENV=development
make -C infrastructure/terraform tf-validate ENV=development
make -C infrastructure/terraform tf-plan ENV=development
make -C infrastructure/terraform tf-apply ENV=development
```

Production apply requires `CONFIRM=yes-apply-production`; production destroy
requires `CONFIRM=yes-destroy-production`.

## Ownership

Terraform owns durable Cloudflare, database/project, DNS, WAF/rate-limit,
observability, mobile-project, and messaging infrastructure. Wrangler owns the
Worker application artifact and its runtime deployment. Docker Compose is a
local/integration tool and is not a production source of truth.

## Module contract

Reusable modules contain:

```text
main.tf
variables.tf
versions.tf
```

Modules with outputs additionally contain `outputs.tf`. Every public input and
output requires documentation. Secrets are injected by the deployment runner
and are never committed to Terraform source.
