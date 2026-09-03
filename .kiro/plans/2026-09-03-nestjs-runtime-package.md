---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/nestjs` — NestJS service runtime adapter

**Status:** Planned  
**Anchor ADRs:** ADR-0017, ADR-0018, ADR-0021, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** `@stackra/node`, `@stackra/container`, `@stackra/config`, `@stackra/logger`, `@stackra/errors`, `@stackra/http`, `@stackra/database`, `@stackra/orm`, `@stackra/health`  
**Design effort:** 20 days across 9 phases

## Purpose

Canonical NestJS bridge: Fastify bootstrap, DI interoperability, module composition, request context, error filters, health/readiness, graceful shutdown and service auto-registration. It adapts NestJS; domain packages remain framework-neutral.

## Non-goals

A replacement for NestJS, business modules or framework-independent service contracts.

## Manager pattern

No driver manager. `NestRuntimeModule` is the composition boundary; driver-based capabilities retain their own Managers.

## Subpath layout

```text
packages/nestjs/src/core/{runtime.module.ts,bootstrap/,context/,lifecycle/,index.ts}
packages/nestjs/src/nestjs/{module.ts,fastify/,filters/,guards/,interceptors/,pipes/,health/,shutdown/,index.ts}
packages/nestjs/src/testing/{testing-module.ts,app-fixture.ts,index.ts}
```

## Contracts / API

Locked exports: `NestRuntimeModule`, `createNestApplication`, `NestRequestContext`, `NestErrorFilter`, `NestGracefulShutdown`, `NestHealthAdapter`.

Bootstrap order follows ADR-0092: config → container → request context → logger → registry → health → error handling. `StackraServiceModule` is the canonical composite where present.

## Security

Fastify is configured with bounded body/parser limits, trusted-proxy policy, request IDs and secure headers. Auth/tenant context is established before controllers. Exceptions are mapped through `@stackra/errors`; internal stacks never reach clients.

## Observability / recovery

Startup/shutdown timings, request latency, error counts and health state are emitted through the logger/observability contracts. Graceful shutdown drains listeners, queues and DB within a hard deadline.

## Testing

Real Nest application bootstrap tests, Fastify HTTP integration, request scope, exception filters, health/readiness and shutdown. No mock-only bootstrap acceptance.

## Phases

1. contracts/scaffold (2d); 2. bootstrap/DI bridge (3d); 3. request context (2d); 4. Fastify HTTP/error pipeline (3d); 5. health/service composite (2d); 6. security (2d); 7. shutdown/observability (2d); 8. integration/conformance (3d); 9. docs/release (1d).

## Exit criteria

Every service boots through one canonical runtime path, request scope is isolated, Fastify/error/health semantics are consistent, and shutdown is bounded.

## Cross-references

`2026-09-03-node-runtime-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-container-package.md`, ADR-0092.
