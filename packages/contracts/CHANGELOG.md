# Changelog

## 1.7.0

### Minor Changes

- c32efd4: Add `filterLocale?: boolean` to `IHttpClientConfig`. When set to `true`, `HttpModule.forRoot()` auto-registers `LocaleHeaderMiddleware` + `LocaleFilterResponseInterceptor` on the connection. Consumers with inline-per-locale JSON responses (`{ en: "…", ar: "…", ru: "…" }` per string leaf) opt in once per connection instead of manually wiring both stages.

## 1.6.0

### Minor Changes

- 01726f0: Wave 4 of the auth-tenancy enterprise alignment — lands the RUNTIME
  resolver for ADR-0096's declarative guard shortcuts. The typing
  surface landed in `@stackra/contracts@1.4.0` (this session); this
  release wires the resolver + the imperative `registerGuard` API.

  **@stackra/contracts** — declarative-guard fields on `IPageConfig` +
  `ILayoutConfig`:

  - `authed?: boolean` — appends `"auth"` to the effective guards
    array (inner position).
  - `tenanted?: boolean` — prepends `"tenant"` to the effective guards
    array (outer position).
  - `public?: boolean` — clears THIS ROUTE'S own guards (escape hatch).

  Composition ordering (from `auth-tenancy-composition.md` §Rule 3):
  tenanted (outer) → authed (inner). Never the reverse.

  **@stackra/routing** — runtime resolver + imperative API:

  - New util `expandGuardShorthands({ authed, tenanted, public, guards })`
    under `core/adapt-page-module/`. Wired into `buildRouteObject`
    right before `stackraHandle.guards` is populated — declarative
    shortcuts on `IPageConfig` / `ILayoutConfig` now transparently
    expand at route-build time.
  - New static `RoutingModule.registerGuard({ name, ctor, priority? })`
    API for imperative guard registration (alternative to the `@Guard`
    decorator when consumers can't decorate a third-party class).
    Follows the ADR-0052 inline-registrar-class pattern.
  - New constants `DECLARATIVE_GUARD_NAMES.{auth,tenant}` exported so
    consumers reference guard names via constants instead of magic
    strings.

  **Limitation** — RRv7 runs every parent match's loader in the chain,
  so `public: true` clears THIS ROUTE'S own guards but every parent
  guard still fires when the route matches. To bypass parent guards
  entirely, hoist the route out of the guarded parent's subtree.

  Refs: ADR-0096 (Declarative route guards),
  `.kiro/steering/auth-tenancy-composition.md` §Rule 3.

## 0.1.5

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

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial implementation
