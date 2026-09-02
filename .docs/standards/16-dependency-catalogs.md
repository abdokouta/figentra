# Dependency Catalog Standard

**Status: APPROVED**

## Rule

Every dependency shared by more than one workspace package belongs in the
root pnpm catalog.

Workspace packages use:

```json
{
  "dependencies": {
    "@nestjs/common": "catalog:"
  }
}
```

## Runtime dependencies

Use `dependencies` for packages imported by production code.

## Development dependencies

Use `devDependencies` for:

- compilers
- test runners
- linters
- formatters
- type definitions
- code generation
- build tooling

## Peer dependencies

Use `peerDependencies` only for reusable libraries that intentionally require
the consuming application to provide the dependency.

Deployable Figentra applications/services should normally have **zero**
peerDependencies.

## Pinning

Use a single catalog version for a platform-wide framework unless a bounded
exception is documented by an ADR.

## Current key versions

- HeroUI 3.2.4
- React 19
- Tailwind CSS 4
- NestJS 12
- Fastify 5
- Node.js 24+
- Hono 4
- Vitest 4
- Oxlint 1.x

Version numbers are centrally managed in the root `pnpm-workspace.yaml` catalog. The root `pnpm-lock.yaml` is the reproducibility gate.
