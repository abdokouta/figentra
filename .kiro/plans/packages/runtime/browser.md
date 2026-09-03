---
status: canonical
component: runtime
package: "@stackra/browser"
---
# `@stackra/browser` — implementation-complete plan

## Purpose
Browser capability boundary for DOM, storage, BroadcastChannel, Web Locks, visibility, navigation and browser lifecycle. Shared core packages must not access browser globals directly.

## API
`BrowserRuntime`, `BrowserStorage`, `BrowserSecureStorageAdapter`, `BroadcastChannelFactory`, `WebLockAdapter`, `VisibilityState`, `BrowserNavigation`, `Clipboard`, `FilePicker` and capability detection. Every API reports unsupported capability explicitly.

## Security
Origin-scoped storage, secure-cookie boundaries, CSP-compatible behavior, no token persistence in arbitrary localStorage unless an ADR explicitly permits it. Web Locks/coordination messages are schema-validated and bounded.

## Lifecycle
Page visibility/suspension can interrupt work. Background work must use coordinator/worker mechanisms; the runtime never promises execution after unload. Event listeners and channels are disposed on unmount/application shutdown.

## Testing
Real browser integration tests for storage, BroadcastChannel, Web Locks, visibility and navigation; unit tests use capability-controlled adapters. Safari/Chromium/Firefox capability differences are captured in conformance tests.

## Completion criteria
No direct browser global access leaks into core packages; unsupported capabilities are explicit; security-sensitive storage is routed through approved adapters; browser lifecycle cleanup is deterministic.