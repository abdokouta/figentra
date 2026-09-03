---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/node"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/config", "@stackra/errors", "@stackra/security", "@stackra/observability"]
---
# `@stackra/node` — implementation plan

## Purpose
Canonical Node.js runtime boundary. It owns process lifecycle, signal handling, filesystem/process adapters, timers, crypto capability access, network/runtime metadata and graceful shutdown. Application packages must not depend directly on Node globals when the capability is exposed here.

## Public API
```ts
interface NodeRuntime {
  capabilities():RuntimeCapabilities;
  initialize():Promise<void>;
  ready():Promise<void>;
  drain(deadlineMs:number):Promise<void>;
  dispose():Promise<void>;
}
interface ProcessLifecycle { onShutdown(handler:()=>Promise<void>):()=>void; state():LifecycleState; exit(code:number):never; }
interface NodeFileSystem { read(path:string):Promise<Uint8Array>; write(path:string,data:Uint8Array):Promise<void>; list(root:string):Promise<FileEntry[]>; }
interface TimerScheduler { delay(ms:number,signal?:AbortSignal):Promise<void>; interval(ms:number,handler:()=>void|Promise<void>):Disposable; }
```

## Source tree
```text
packages/node/
├── src/core/{runtime.ts,capabilities.ts,lifecycle.ts,signals.ts,timers.ts,env-source.ts,errors/,index.ts}
├── src/fs/{filesystem.ts,path-policy.ts,index.ts}
├── src/process/{process-controller.ts,index.ts}
├── src/network/{network-capabilities.ts,index.ts}
├── src/crypto/{crypto-adapter.ts,index.ts}
├── src/testing/{runtime-fixture,signal-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Lifecycle
`load-config → construct-container → initialize → ready → draining → disposed`. SIGTERM/SIGINT initiate drain. Once draining begins, new work is rejected; active HTTP/NATS/worker operations receive bounded cancellation deadlines. Shutdown hooks run deterministically and only once.

## Filesystem/process security
All filesystem access uses explicit roots and canonical path checks. Traversal, symlink escapes and writes outside approved roots are rejected. Environment/argv values are classified and never dumped into logs. Child process execution requires an explicit allowlist and argument array; shell interpolation from untrusted input is prohibited.

## Networking/crypto
Outbound HTTP uses `@stackra/http`; raw sockets require explicit adapter ownership. Crypto uses platform CSPRNG and delegates algorithm/policy definitions to `@stackra/security`. Capability detection is explicit.

## Observability
Lifecycle transitions, shutdown duration, open handles, filesystem failures and runtime capability mismatches are measured. Runtime does not log environment secrets. OTel spans/metrics use the observability package.

## Testing
Signal/drain ordering, repeated signals, timer cancellation, filesystem root escapes, process invocation restrictions, capability detection, resource cleanup and supported Node baseline. Integration tests verify graceful shutdown with active HTTP/NATS operations.

## Implementation phases
1. Core lifecycle/capabilities.
2. filesystem/process/timer adapters.
3. crypto/network integration.
4. observability/security.
5. runtime conformance/failure/shutdown tests.

## Exit criteria
- Direct Node-global usage outside runtime adapters is prohibited by architecture/lint rules.
- Drain is bounded and deterministic.
- Filesystem/process operations are policy-bound.
- No browser/Worker emulation is exposed as Node behavior.
