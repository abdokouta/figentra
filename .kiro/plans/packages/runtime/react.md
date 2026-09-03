---
status: canonical
component: runtime
package: "@stackra/react"
---
# `@stackra/react` — implementation-complete plan

## Purpose
React integration for platform services and UI packages. It provides context providers, hooks, lifecycle-safe subscriptions and error boundaries without embedding business logic.

## API
`RuntimeProvider`, `ContainerProvider`, `RequestContextProvider`, `useInject`, `useRequestContext`, `useEvent`, `useAsyncResource`, `useDisposable`, `ErrorBoundary` and testing helpers. Hooks are stable, cleanup-safe and typed.

## State/effects
Network/data synchronization belongs to service clients and `@stackra/sync`; local component state remains React-owned. Effects must clean subscriptions/timers. No hidden singleton mutable state is introduced by providers.

## Runtime composition
React DOM uses browser adapters; React Native uses the native runtime subpath. Shared hooks are implemented against neutral contracts where possible. Cross-tab behavior composes `@stackra/coordinator` rather than creating a second event mechanism.

## Security
Context providers do not expose secrets through React devtools or serialized state. Authentication context is obtained from Identity clients and authorization is evaluated by service/IAM boundaries.

## Testing
Strict-mode double mount/unmount, provider nesting, context isolation, async cancellation, subscription cleanup, error boundaries and browser/native conformance. Hooks have deterministic test fixtures with no real network dependencies.

## Completion criteria
Every React integration has explicit provider ownership and cleanup semantics; no business service logic is hidden in hooks; browser/native differences remain adapter-level.