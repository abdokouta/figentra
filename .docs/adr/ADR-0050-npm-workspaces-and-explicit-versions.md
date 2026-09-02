# ADR-0050 — Superseded: Workspace and Dependency Management

**Status:** Superseded

## Decision

This ADR originally defined npm workspaces and explicit dependency versions.
That policy is no longer current.

## Superseding decision

FigenTra uses **pnpm** as the sole package manager. The root
`pnpm-workspace.yaml` is the only workspace definition; external dependencies
use the `catalog:` protocol; internal workspace dependencies use `workspace:*`;
and `pnpm-lock.yaml` is the canonical reproducibility artifact.

See the approved dependency-catalog and bootstrap standards for the current
implementation rules.
