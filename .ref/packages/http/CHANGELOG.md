# @stackra/http

## 3.0.0

### Minor Changes

- c32efd4: Add `LocaleFilterResponseInterceptor` — opt-in per connection via `filterLocale: true` on the connection config. Slices inline-per-locale response bodies to the active locale value at the transport boundary. When a connection sets `filterLocale: true`, `HttpModule.forRoot()` auto-registers both `LocaleHeaderMiddleware` (request-side `X-Language` + `Accept-Language` stamp) AND `LocaleFilterResponseInterceptor` (response-side slice) for symmetry — one flag turns on the whole locale substrate.

  Fail-soft: when `I18N_LOCALE_SERVICE` isn't bound (i18n package not installed) OR when `getSupportedLocales()` returns an empty list, both contributions are pass-throughs. Per-request opt-out via `meta.skipLocaleFilter: true` OR `meta.skipLocale: true`.

### Patch Changes

- Updated dependencies [c32efd4]
  - @stackra/contracts@1.7.0
  - @stackra/config@3.0.0
  - @stackra/container@3.0.0
  - @stackra/decorators@3.0.0
  - @stackra/logger@3.0.0
  - @stackra/ui@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [1e1f0aa]
- Updated dependencies [01726f0]
  - @stackra/ui@2.0.0
  - @stackra/contracts@1.6.0
  - @stackra/logger@2.0.0
  - @stackra/config@2.0.0
  - @stackra/container@2.0.0
  - @stackra/decorators@2.0.0

## 0.1.1

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
  - @stackra/actions@0.1.1
  - @stackra/container@2.1.1
  - @stackra/contracts@0.1.5
  - @stackra/logger@0.1.1
  - @stackra/support@0.1.1
  - @stackra/testing@1.0.1
