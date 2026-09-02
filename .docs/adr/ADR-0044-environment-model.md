# ADR-0044 — Environment Model

## Status
Accepted.

## Decision
Canonical environments are:

- `development`
- `staging`
- `production`

CLI aliases are `dev`, `stg`, and `prd`. They normalize to canonical names
before execution.

There is no independent `prod` environment identifier.

## Consequences
Configuration, Terraform, deployment manifests, logs and audit records use
unambiguous names.
