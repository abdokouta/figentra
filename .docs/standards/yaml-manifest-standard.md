# YAML Manifest Standard

Every non-generated YAML/YML configuration file must be understandable without
opening the consuming code.

## Required documentation

A hand-authored manifest begins with a structured comment block containing:

- `@file`
- `@description`
- `@ownership`
- `@security`
- `@source-of-truth`

Section-level comments explain non-obvious fields and operational invariants.

## Manifest ownership

- `cloud.yaml` — deployable runtime/infrastructure contract.
- `catalog.json` — reusable package metadata for Stackra packages.
- Terraform HCL — infrastructure source of truth.
- Generated YAML — generated artifact; its header must say what generated it
  and must not be edited manually.

## Security

Never put secrets, private keys, tokens, passwords, or credentials in YAML.
Use Doppler/runtime secret injection or platform secret stores.

## Environments

Canonical names are `development`, `staging`, and `production`. Short aliases
are CLI-only conveniences.

## Comments

Comments must explain why, ownership, safety, or operational meaning. Avoid
comments that merely restate a YAML key.
