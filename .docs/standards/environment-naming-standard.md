# Environment Naming Standard

## Decision

Figentra uses the canonical long-form environment names:

- `development`
- `staging`
- `production`

Short aliases may be accepted by CLI tooling for convenience:

- `dev` -> `development`
- `stg` -> `staging`
- `prd` -> `production`

The canonical names are used in configuration, manifests, Terraform directories,
documentation, generated artifacts, logs, audit records, and API contracts.

## Rationale

Long-form names are unambiguous, self-documenting, and easier for operators,
automation, AI agents, and external integrations to understand. Short aliases
remain useful for interactive commands but must normalize to the canonical name
before execution.

## Rules

- Never create a fourth environment without an ADR.
- Never mix `prd`, `prod`, and `production` as independent identifiers.
- Terraform canonical directories are `development`, `staging`, and `production`.
- `dev`, `stg`, and `prd` are aliases only.
