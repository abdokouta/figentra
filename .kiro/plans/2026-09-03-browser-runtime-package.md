---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/browser` — browser runtime adapter

**Status:** Planned  
**Anchor ADRs:** ADR-0091  
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/http`, `@stackra/storage`, `@stackra/auth`, `@stackra/router`, `@stackra/navigation`, `@stackra/realtime`  
**Design effort:** 13 days across 7 phases

## Purpose

Browser-only bindings for Web APIs: storage, BroadcastChannel/coordinator, visibility, online state, history, fetch, notifications and secure capability boundaries.

## Non-goals

Server APIs, Node filesystem/process APIs or React components (those belong to `@stackra/react`).

## Manager pattern

No manager; `BrowserRuntime` exposes typed capability adapters through the container.

## Subpath layout

```text
packages/browser/src/core/{browser.module.ts,capabilities/,env/,index.ts}
packages/browser/src/browser/{storage/,broadcast/,history/,network/,visibility/,notifications/,index.ts}
packages/browser/src/testing/{browser-fixture.ts,index.ts}
```

## Contracts / API

Locked exports: `BrowserModule`, `BrowserRuntime`, `BrowserStorageAdapter`, `BrowserNetworkAdapter`, `BrowserHistoryAdapter`, `BrowserBroadcastAdapter`.

## Security

Origin/URL allowlists, storage partitioning, no secrets in localStorage by default, safe external navigation and CSP-compatible behavior. Browser capability detection is explicit and testable.

## Errors / observability / testing

Unsupported capabilities produce typed errors. Metrics avoid fingerprinting. Test private browsing/storage denial, offline transitions, history and BroadcastChannel behavior.

## Phases

1. contracts/scaffold (2d); 2. capability container (2d); 3. storage/network/history (3d); 4. broadcast/realtime (2d); 5. security/errors (1d); 6. browser conformance (2d); 7. docs/release (1d).

## Exit criteria

Browser APIs are isolated from core, capability failures are explicit, and no sensitive credential is persisted in an unsafe store.

## Cross-references

`2026-09-03-react-runtime-package.md`, `2026-09-03-storage-package.md`, `2026-09-03-navigation-package.md`, ADR-0091.
