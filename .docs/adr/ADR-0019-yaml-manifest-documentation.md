# ADR-0019 — Repository-wide YAML Manifest Documentation

## Status

Accepted.

## Decision

Every YAML/YML file in Figentra must have a file-level documentation block and
operational/security-sensitive fields must have nearby comments explaining
purpose, ownership, source of truth, and secret handling.

`cloud.yaml` remains the deployable manifest source of truth. Generated files
must never become a competing configuration authority.

## Consequences

- Configuration is easier for humans and AI agents to understand.
- CI can enforce the manifest contract.
- Secret handling is explicit.
- Generated files remain reproducible.
