# Tooling Packages

Tooling packages are developer-facing implementation capabilities that support package/service/application construction. They are not runtime foundations and are not business services.

## Rules

A tooling package owns its complete CLI/build/test/code-generation lifecycle. Runtime integrations are subpaths of the owning tooling package where practical. Shared configs are explicit packages only when they are independently consumed/released.

## Canonical tooling

- `@stackra/build-tooling` — deterministic build/package orchestration.
- `@stackra/testing` — shared test fixtures, presets and conformance harnesses.
- `@stackra/console` — framework-neutral CLI/console command infrastructure.
- `@stackra/openapi` — OpenAPI contract generation/validation tooling where used.
- `@stackra/vite` — Vite integration/build configuration for browser applications.

Node/Nest/React implementation details belong in subpaths or peer integrations, never duplicated as independent capability packages.

## Quality gate

Tooling must be deterministic, CI-safe, version-pinned through repository catalogs, secret-safe and incapable of becoming a production runtime dependency accidentally.
