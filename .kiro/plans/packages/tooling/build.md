---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
---

# `@stackra/build-tooling` — deterministic workspace build platform

## Ownership

Owns reusable build orchestration, package graph validation, declaration generation, bundle targets, source maps, artifact checks and release/build metadata. It does not own application runtime behavior.

## Subpaths

```text
@stackra/build-tooling
@stackra/build-tooling/tsup
@stackra/build-tooling/vite
@stackra/build-tooling/nestjs
@stackra/build-tooling/worker
@stackra/build-tooling/testing
```

## Source layout

```text
src/core/{graph,artifacts,validation,cache,release,index.ts}
src/tsup/{config,plugins,index.ts}
src/vite/{config,plugins,index.ts}
src/nestjs/{build,target,index.ts}
src/worker/{wrangler,bindings,index.ts}
src/testing/{fixtures,assertions,index.ts}
__tests__/{unit,integration,conformance}/
```

## Build contract

Builds must be reproducible, explicit about entrypoints/exports and free of environment-dependent hidden behavior. Package roots may not bundle optional runtime dependencies they do not use. Build metadata records compiler/runtime target, dependency graph hash and source revision.

## Validation

CI verifies package exports, dependency direction, Node-only imports in Workers, undeclared peer dependencies, duplicate package versions and forbidden service-to-service imports.

## Security

No secrets enter bundles or build artifacts. Build logs redact credentials. Lockfiles/catalogs remain authoritative for third-party versions.

## Caching / recovery

Local/remote caches are content-addressed and safely invalidated by graph/config/source changes. A cache miss must never change semantic output. Failed builds leave no partially published artifact.

## Testing / exit

Test each subpath and representative package/service builds in clean environments. Worker builds execute runtime compatibility checks. Exit requires deterministic output, explicit exports and CI enforcement of architectural boundaries.
