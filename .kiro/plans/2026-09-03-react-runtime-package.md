---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/react` — React runtime composition layer

**Status:** Planned  
**Anchor ADRs:** ADR-0091, ADR-0092  
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/state`, `@stackra/query`, `@stackra/router`, `@stackra/i18n`, `@stackra/theming`  
**Design effort:** 14 days across 8 phases

## Purpose

React-only composition layer: ContainerProvider, runtime hooks, error boundaries, hydration/config bootstrap and integration points for query, router, i18n, theme, tracking and realtime packages.

## Non-goals

Domain components, server-side routing, transport implementation or a second state-management system.

## Manager pattern

No driver Manager. `ReactRuntimeProvider` composes injected platform services and owns lifecycle cleanup.

## Subpath layout

```text
packages/react/src/core/{runtime-context.ts,provider.tsx,errors/,index.ts}
packages/react/src/react/{providers/,hooks/,boundaries/,hydration/,index.ts}
packages/react/src/testing/{render.tsx,providers.tsx,index.ts}
```

## Contracts / API

`@stackra/contracts/react` owns runtime provider/context contracts. Locked exports: `ReactRuntimeProvider`, `ContainerProvider`, `useInject`, `useOptionalInject`, `useRequestContext`, `RuntimeErrorBoundary`, `useRuntimeReady`.

Providers must be composable and idempotent under React Strict Mode. Hooks resolve from the nearest container context and never use module-level mutable registries.

## Security / runtime

Configuration hydration cannot expose server secrets. Error boundaries render safe errors. SSR/hydration uses a serializable bootstrap payload with explicit allowlisted fields.

## Errors / observability / testing

Boundary errors normalize through `@stackra/errors`; runtime initialization failures are observable. Test Strict Mode, SSR hydration, provider remount, missing providers and request-context isolation.

## Phases

1. Contracts/scaffold (2d); 2. provider/container integration (2d); 3. hooks/context (2d); 4. error/hydration boundaries (2d); 5. package integrations (2d); 6. security/observability (1d); 7. tests (2d); 8. docs/release (1d).

## Exit criteria

No React dependency enters runtime-neutral packages; Strict Mode is safe; hydration is deterministic; all providers clean up correctly.

## Cross-references

`2026-09-03-container-package.md`, `2026-09-03-ui-package.md`, `2026-09-03-query-package.md`, `2026-09-03-router-package.md`, ADR-0091.
