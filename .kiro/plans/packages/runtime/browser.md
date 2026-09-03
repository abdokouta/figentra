---
status: canonical
component: package
package: "@stackra/browser"
---
# Browser Runtime — implementation plan

Browser adapter for storage, secure/session state, HTTP, realtime, links, lifecycle and tracking. Core packages remain DOM-free.

## Rules
Use browser-native APIs through adapters; feature-detect capabilities; never assume localStorage/IndexedDB availability. Auth/session data follows `@stackra/identity` security rules.

## Testing
Browser capability matrix, private-mode/storage failure, network loss, lifecycle/unload, realtime reconnect and tracking consent.

## Exit criteria
Browser runtime is explicit, testable and does not leak browser globals into runtime-neutral packages.
