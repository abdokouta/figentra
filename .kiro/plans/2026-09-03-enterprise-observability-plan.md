---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra enterprise observability — logs, metrics, traces and audit

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0092, ADR-0021  
**Depends on:** `@stackra/contracts`, `@stackra/logger`, `@stackra/errors`, `@stackra/container`  
**Design effort:** 18 days across 9 phases

## Purpose

Standardize operational telemetry across every runtime: structured logs, metrics, traces, health signals and security audit events. Correlation, tenant and actor context propagate consistently.

## Non-goals

Business analytics (`@stackra/tracking`), log storage vendor ownership or dashboard UI.

## Manager pattern

Telemetry fan-out uses `MultipleInstanceManager` where multiple exporters are configured; logger remains the canonical log pipeline.

## Subpath layout

```text
packages/observability/src/core/{observability.module.ts,metrics/,tracing/,audit/,health/,context/,redaction/,index.ts}
packages/observability/src/{otel,sentry,datadog,console}/
packages/observability/src/nestjs/{module.ts,interceptors/,health/,index.ts}
packages/observability/src/worker/{module.ts,index.ts}
packages/observability/src/testing/{telemetry-fixture.ts,index.ts}
```

## Contracts / API

`@stackra/contracts/observability` owns `IMetric`, `IMeter`, `ITracer`, `ISpan`, `IAuditEvent`, `IAuditSink`, context contracts and tokens. Public operations: `counter`, `histogram`, `startSpan`, `recordAudit`, `flush`.

## Runtime behavior

Every request/execution has trace/correlation/request IDs. Async work preserves context explicitly. Worker telemetry flushes through `waitUntil`; shutdown drains exporters with hard limits. Exporter failure is isolated from business execution unless a compliance-required audit write cannot be accepted.

## Security

Redact secrets centrally; prohibit high-cardinality PII labels; audit records are immutable and access-controlled. Sampling policies cannot disable mandatory security/audit events.

## Errors / recovery

Exporter failures use bounded buffers, backpressure and drop policy. Audit failures are surfaced according to compliance policy. Telemetry code never throws into normal business paths except explicitly configured fail-closed audit operations.

## Persistence / compatibility

Audit schema is versioned. Metrics/traces are ephemeral telemetry; retention is exporter-owned. Context field names are stable across services.

## Testing / conformance

Test context propagation, redaction, sampling, exporter failure, buffer limits, trace parent/child relationships and audit immutability. Run real exporter smoke tests in CI where credentials are safely provisioned.

## Phases

1. contracts/scaffold (2d); 2. context model (2d); 3. metrics/tracing (3d); 4. audit (2d); 5. logger/error integration (2d); 6. Nest/Worker runtime (2d); 7. exporters (2d); 8. security/conformance (2d); 9. docs/release (1d).

## Exit criteria

Every service emits consistent telemetry, context crosses async/runtime boundaries, sensitive data is redacted and exporter failures cannot take down business traffic.

## Cross-references

`2026-09-03-logger-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-tracking-package.md`, `2026-09-03-enterprise-security-plan.md`.
