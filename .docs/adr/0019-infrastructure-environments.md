# ADR-0019 — Terraform environment boundaries

## Status

Accepted.

## Decision

Figentra standardizes on `dev`, `stg`, and `prd` Terraform environment roots.

Each environment has:

```text
main.tf
variables.tf
versions.tf
providers.tf
backend.tf
README.md
```

Deployables do not own environment roots. They publish deployment intent through
their `cloud.yaml`, while Terraform environment composition owns provider state.

Docker Compose is development-only and is generated from the same manifests plus
the local infrastructure catalog.
