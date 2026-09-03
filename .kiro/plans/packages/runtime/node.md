---
status: canonical
component: runtime
package: "@stackra/node"
---
# `@stackra/node` — implementation-complete plan

## Purpose
Canonical Node.js runtime boundary for process lifecycle, filesystem/process adapters, timers, crypto, networking primitives and graceful shutdown. Application/business packages remain runtime-neutral.

## API
`NodeRuntime`, `RuntimeCapabilities`, `ProcessLifecycle`, `TimerScheduler`, `NodeCrypto`, `NodeEnvSource`, `NodeFileSystem` and typed `RuntimeError`. APIs expose cancellation and deadlines where asynchronous.

## Lifecycle
Bootstrap phases are `load-config → construct-container → initialize → ready → draining → disposed`. Signals (`SIGTERM`, `SIGINT`) initiate graceful drain. New work is rejected after draining begins; active HTTP/NATS work gets a bounded deadline.

## Configuration/security
Environment is read only by the config adapter. Process arguments and environment values are classified and never dumped. File access uses explicit roots; path traversal is rejected. Crypto uses platform CSPRNG and delegates algorithms to `@stackra/security`.

## Networking
Outbound network access is through `@stackra/http` or explicit provider adapters. DNS/socket behavior is observable and bounded; arbitrary egress is not silently permitted.

## Testing
Lifecycle, signal handling, timers, cancellation, filesystem boundaries, crypto capability detection, environment isolation, resource cleanup and Node-version compatibility. Production adapter tests run against the supported Node baseline.

## Completion criteria
No package imports `process`, filesystem or Node-only globals directly except through documented runtime adapters; shutdown is deterministic; capability checks are explicit; no browser/worker shims masquerade as Node implementations.