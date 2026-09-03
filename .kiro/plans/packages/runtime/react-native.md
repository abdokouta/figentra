---
status: canonical
component: package
package: "@stackra/react-native"
---
# React Native Runtime — implementation plan

React Native adapter for identity, secure storage, filesystem/media, HTTP, realtime, links and tracking.

## Rules
Native capabilities are isolated behind adapters; tokens/credentials use platform secure storage; offline buffers are bounded and encrypted where required; app lifecycle pauses/resumes resources explicitly.

## Testing
iOS/Android capability matrix, offline/restart, secure storage failure, background/foreground transitions, network loss, upload/realtime cleanup and tracking consent.

## Exit criteria
Production-grade RN lifecycle/security behavior with no native globals in core packages.
