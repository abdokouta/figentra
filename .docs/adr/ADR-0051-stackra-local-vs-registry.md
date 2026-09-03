# ADR-0051 — Stackra Local Package Boundary

## Status

Accepted.

## Decision

Only these four Stackra packages are maintained as local npm workspaces:

- `@stackra/tsup-config`
- `@stackra/typescript-config`
- `@stackra/prettier-config`
- `@stackra/oxlint-config`

All other `@stackra/*` dependencies are consumed from the npm registry.

The four local packages keep their package names and versions and are referenced
by their exact published/local version in consuming manifests. Because they are
npm workspaces, npm resolves them from the local workspace rather than
downloading a duplicate registry copy when the workspace version satisfies the
declaration.

## Rules

1. Do not vendor another `@stackra/*` package under `packages/`.
2. Do not use pnpm `link:`, `catalog:`, or `workspace:` protocols.
3. Do not use `file:` for these four workspace packages.
4. Consuming manifests declare the exact local package version.
5. Other Stackra packages remain normal npm registry dependencies.
6. The local packages are allowed to be published packages; local development
   takes precedence through npm workspace resolution.
