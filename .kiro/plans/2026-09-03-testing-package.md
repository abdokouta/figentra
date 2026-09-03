---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/testing` — enterprise test framework and conformance package

**Status:** Planned  
**Anchor ADRs:** ADR-0091 and repository testing steering  
**Depends on:** `@stackra/contracts`, `@stackra/container`, Vitest and runtime-specific test peers  
**Design effort:** 16 days across 8 phases

## Purpose

Shared Vitest presets, factories, deterministic clocks/IDs, assertion helpers, real container harnesses, HTTP/Worker/DB fixtures and adapter-conformance suites. Tests must exercise production contracts rather than placeholder implementations.

## Non-goals

Production mocks shipped by application packages, test data containing real credentials, or replacing runtime integration tests with unit tests.

## Manager pattern

Not applicable. Testing utilities are factories/fixtures with explicit lifecycle ownership.

## Subpath layout

```text
packages/testing/src/{core/,preset/,matchers/,setup/,nest/,worker/,database/,react/}
__tests__/{unit/,integration/,conformance/,runtime/}
```

## Public API — locked

`createTestContainer`, `createTestClock`, `createTestIdFactory`, `createAssertableProxy`, `createHttpFixture`, `createWorkerFixture`, `createDatabaseFixture`, `assertContract`, and Vitest presets for base/Nest/Worker/React.

Presets never silently change production behavior. Worker tests use the real workerd pool where supported; database tests use disposable real engines or PGlite for fast integration, with real-provider suites for release acceptance.

## Security / isolation

Fixtures isolate filesystem, DB schemas, queues and network mocks per test. Credentials are synthetic. Snapshot serializers redact secrets. Tests fail if secret-shaped values are accidentally logged.

## Observability / failure

Tests emit machine-readable diagnostics, duration and fixture-leak information. Hung tests fail with resource ownership information. All fixtures implement deterministic cleanup.

## Conformance

Every driver-based package must expose a conformance suite consumed by all drivers. Runtime packages test actual platform semantics. Public exports are exhaustively imported to prevent accidental API drift.

## Phases

1. scaffold/presets (2d); 2. core factories/matchers (2d); 3. container/Nest (2d); 4. Worker (2d); 5. database/storage (2d); 6. React/native (2d); 7. conformance/security (3d); 8. docs/release (1d).

## Exit criteria

All platform packages can run unit + integration + contract + conformance suites through one standard package; no critical behavior is accepted solely through mocks.

## Cross-references

`2026-09-03-build-tooling-plan.md`, `2026-09-03-container-package.md`, `2026-09-03-database-package.md`, repository testing steering.
