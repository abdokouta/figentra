---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/node` — Node runtime foundation

**Status:** Planned  
**Anchor ADRs:** ADR-0017, ADR-0018, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** `@stackra/container`, `@stackra/config`, `@stackra/logger`, `@stackra/errors`, `@stackra/storage`, `@stackra/database`, `@stackra/orm`, `@stackra/queue`, `@stackra/nats`  
**Design effort:** 18 days across 9 phases

## Purpose

Node runtime bindings for process lifecycle, filesystem, signals, environment, HTTP primitives, crypto and graceful shutdown. Runtime-neutral packages never import these bindings.

## Non-goals

NestJS application integration (see `/nestjs`), business services or a second dependency container.

## Manager pattern

No driver manager; `NodeRuntimeModule` registers canonical Node capabilities into the container.

## Subpath layout

```text
packages/node/src/core/{runtime.module.ts,capabilities/,lifecycle/,signals/,index.ts}
packages/node/src/node/{filesystem/,crypto/,process/,streams/,shutdown/,index.ts}
packages/node/src/testing/{node-fixture.ts,index.ts}
```

## Contracts / API

Locked exports: `NodeRuntimeModule`, `NodeRuntime`, `GracefulShutdown`, `ProcessSignalHandler`, `NodeFilesystem`, `NodeCrypto`, `NodeStreams`.

## Lifecycle

Install signal handlers once per process; shutdown is ordered: stop intake → drain transports/queues → flush logs/telemetry → close DB/storage → exit. Timeouts are bounded and observable.

## Security / observability

Environment variables are not logged. Filesystem operations go through the file-system package and root restrictions. Signal/shutdown metrics expose durations and forced termination counts.

## Testing

Test signal idempotency, shutdown ordering, timeout, process environment isolation and stream cleanup using disposable fixtures.

## Phases

1. contracts/scaffold (2d); 2. capabilities (2d); 3. lifecycle/signals (3d); 4. filesystem/crypto/streams (3d); 5. platform integrations (2d); 6. security (1d); 7. observability (1d); 8. conformance (3d); 9. docs/release (1d).

## Exit criteria

Graceful shutdown is deterministic and bounded; runtime globals remain inside this package; all capabilities are injectable and testable.

## Cross-references

`2026-09-03-container-package.md`, `2026-09-03-file-system-package.md`, `2026-09-03-nestjs-runtime-package.md`, ADR-0017/0091/0092.
