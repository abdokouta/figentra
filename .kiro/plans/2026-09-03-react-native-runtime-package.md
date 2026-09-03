---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/react-native` — React Native runtime composition

**Status:** Planned  
**Anchor ADRs:** ADR-0091  
**Depends on:** `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/state`, `@stackra/query`, `@stackra/navigation`, `@stackra/auth`, `@stackra/storage`, `@stackra/link`  
**Design effort:** 16 days across 8 phases

## Purpose

RN runtime adapters for DI, navigation/deep links, secure storage, filesystem, connectivity, app lifecycle, notifications and runtime-safe hooks. Platform modules are isolated from core packages.

## Non-goals

Business screens, web DOM APIs, server authentication logic or a replacement for native platform APIs.

## Manager pattern

No manager; `NativeRuntimeProvider` composes runtime services and disposes subscriptions on app lifecycle changes.

## Subpath layout

```text
packages/react-native/src/core/{runtime-context.ts,provider.tsx,index.ts}
packages/react-native/src/native/{storage/,secure-storage/,filesystem/,navigation/,links/,lifecycle/,connectivity/,notifications/,index.ts}
packages/react-native/src/testing/{render.tsx,native-fixtures.ts,index.ts}
```

## Contracts / API

Locked exports: `NativeRuntimeProvider`, `useNativeRuntime`, `useAppState`, `useNetworkState`, `useSecureStorage`, `useNativeLinking`, `useNavigation`. Contracts live in `@stackra/contracts`.

## Security

Tokens use OS secure storage. Deep links are normalized and allowlisted. Clipboard, filesystem and external URL APIs are explicit capabilities. Sensitive data is never logged.

## Errors / observability / testing

Native failures normalize through `@stackra/errors`. Lifecycle metrics are minimal and privacy-safe. Test background/foreground transitions, storage failure, link routing, connectivity changes and provider cleanup.

## Phases

1. scaffold/contracts (2d); 2. provider/container (2d); 3. secure/local storage (2d); 4. navigation/links (2d); 5. lifecycle/connectivity (2d); 6. notifications/auth integrations (2d); 7. security/conformance (3d); 8. docs/release (1d).

## Exit criteria

No DOM/Node globals leak into RN bundles; secure storage is used for credentials; lifecycle cleanup is deterministic; adapters pass runtime contract tests.

## Cross-references

`2026-09-03-navigation-package.md`, `2026-09-03-auth-package.md`, `2026-09-03-storage-package.md`, ADR-0091.
