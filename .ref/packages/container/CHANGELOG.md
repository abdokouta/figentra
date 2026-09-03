# Changelog
## Unreleased — Cloudflare Worker runtime composition

- Make `WorkerModule` a global declarative module that owns the complete public Worker DI surface.
- Add request-scoped `WORKER_CONTEXT`, `WORKER_ENV`, `WORKER_REQUEST`, and `WORKER_EXECUTION_CONTEXT` providers.
- Keep the internal runtime bridge token private to the Worker adapter.
- Make request-context values first-class DI values during dependency resolution.
- Automatically compose `WorkerModule` into Worker application bootstrap.
- Keep Cloudflare routing/runtime concerns outside the core DI container.


## Unreleased

### Added

- Runtime-neutral request contexts with isolated request-scoped provider instances.
- `REQUEST_SCOPE` compatibility constant and request-scope detection.
- `@stackra/container/worker` Cloudflare Workers adapter.
- Worker runtime tokens: `WORKER_ENV`, `WORKER_REQUEST`, `WORKER_EXECUTION_CONTEXT`, and `WORKER_CONTEXT`.
- Worker application bootstrap caching with retry after bootstrap failure.
- Worker request test coverage and Cloudflare Worker example.

### Changed

- Core entry no longer exports React bindings, preventing React from entering Worker/Node bundles through the root import. React and Native integrations remain available from their dedicated subpaths.
- Application factory supports disabling global application registration for runtime adapters.
- Application shutdown clears active request contexts before application lifecycle hooks.



## 3.0.0

### Patch Changes

- Updated dependencies [c32efd4]
  - @stackra/contracts@1.7.0

## 2.0.0

### Patch Changes

- Updated dependencies [01726f0]
  - @stackra/contracts@1.6.0

## 2.1.1

### Patch Changes

- 552943e: Workspace-wide standards conformance sweep. No behavioural changes;
  no public API changes. Every `@stackra/*` frontend package converges on the
  shared per-file discipline defined under `.kiro/steering/`.

  - **Package manifests normalised.** Removed the redundant leaf-level
    `packageManager` field on 37 packages; moved `react` / `react-dom` /
    `reflect-metadata` peers to the workspace catalog so version drift is
    impossible.
  - **React entity files nested per folder.** Every hook, context, component and
    provider that previously sat at the top of `react/hooks/`,
    `react/contexts/`, `react/components/`, or `react/providers/` now lives in
    its own named folder (`react/hooks/use-x/use-x.hook.ts`, etc.) with a barrel
    `index.ts` — matching `.kiro/steering/code-standards.md`. 214 files moved;
    imports through the public subpath entries are unchanged.
  - **Native helpers routed through `@stackra/support`.** 55+ call sites
    migrated from native `.toLowerCase()` / hand-rolled `sleep` / `process.env`
    reads / ad hoc URL string building to the canonical `Str`, `sleep`, `Env`,
    `Uri`, `once`, and `retry` helpers per
    `.kiro/steering/support-utilities.md`.
  - **Inline documentation added.** 291 source files gained top-of-file `@file`
    / `@module` / `@description` docblocks. 107 barrel indexes received full
    canonical blocks, 178 files with partial docblocks were augmented with the
    missing `@file` tag, and 6 fully undocumented interface files received full
    JSDoc coverage per `.kiro/steering/documentation.md`.
  - **Typecheck GREEN** across all 42 packages after every round.

- Updated dependencies [552943e]
  - @stackra/contracts@0.1.5
  - @stackra/support@0.1.1
  - @stackra/testing@1.0.1

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial implementation
