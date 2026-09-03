---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# Figentra global engineering standards — enterprise plan

**Anchor ADRs:** ADR-0020, ADR-0088, ADR-0090, ADR-0091, ADR-0092

## Purpose

Single enforceable standard for naming, package boundaries, TypeScript, build/test manifests, dependency direction, contracts, DI, discovery, configuration, environments, security, observability, service runtime roles, infrastructure, documentation and releases.

## Locked standards

`src/` is the source root; Node >=22; TypeScript strict; tsup builds publishable packages; Vitest is the standard test runner except explicitly documented runtime exceptions; explicit exports are mandatory; cross-package JIT is forbidden; internal dependencies use workspace protocols; third-party versions use catalogs. Core packages are runtime-neutral and runtime-specific APIs stay behind explicit runtime boundaries.

Canonical cross-service vocabulary is defined once in `@stackra/contracts`. Discovery is find → registry → populator/factory. Driver-based packages use the Manager/MultipleInstanceManager pattern where justified. Environment identifiers are exactly `development`, `staging`, `production`.

## Identity standard

Authentication and identity are one bounded context exposed by `@stackra/identity`. Supabase Auth is the day-one human authentication provider. The identity package owns provider adapters, verification, principal normalization, session/credential references, service identities and explicit identity context. IAM/Policy owns authorization. A standalone `@stackra/auth` package is not part of the target dependency graph.

## Service/package/worker standard

- Packages contain reusable technical/platform capabilities or genuine SDKs.
- Services own bounded-context business implementations under `services/<service>/src/modules`.
- A service can expose API, NATS consumer, worker and scheduler roles from the same NestJS codebase.
- A mirrored `workers/<service>` application is prohibited unless an ADR proves an independent runtime/deployment boundary.
- Cross-service consumers import only versioned contracts from `@stackra/contracts`.
- Internal service interfaces, persistence entities and provider SDK types remain private.
- Cloudflare Workers are explicit edge/serverless workloads, not the default background-worker runtime.

## Signal ownership standard

| Concern | Owner | Boundary |
|---|---|---|
| Logs | `@stackra/logger` | structured operational/application diagnostics |
| OpenTelemetry | `@stackra/observability` | traces, metrics, propagation, instrumentation/export |
| Monitoring | infrastructure/operations | collectors, backends, dashboards, alerts, SLOs |
| Audit | Audit service | durable accountability records |
| Tracking | `@stackra/tracking` | product/campaign/ad behavioral collection + consent |
| Analytics | Analytics service | durable analytical ingestion, aggregation, attribution, queries |
| Marketing | Marketing service | campaigns, audiences, activation, server-side conversions |
| Usage | Usage service | billable metering |
| Domain events | `@stackra/events` | business facts |
| Notifications | Notifications service | delivery orchestration and provider execution |

Logs, traces, metrics, audit, tracking, analytics and marketing MUST NOT be treated as one generic telemetry stream.

## NestJS standard

NestJS is the canonical Node.js service framework. Use its native modules/DI, microservice transports, NATS integration, queue integration, lifecycle hooks, validation and OpenAPI capabilities. NestJS supports NATS request/response, event-based messaging, queue groups and hybrid HTTP + microservice applications. citeturn0search1turn0search3turn2search7

For current NestJS v12 targets, align all `@nestjs/*` packages to the same major and use the current NATS v3 transport (`@nats-io/transport-node`) rather than the legacy `nats` package. NestJS v12 also supports Standard Schema validation and has updated CLI/build defaults. citeturn3search1turn3search2

## Service runtime standard

```text
services/<service>/
├── src/modules/       # domain/application/infrastructure modules
├── src/bootstrap/     # explicit role bootstrap
└── ...

RUNTIME_ROLE=api       → HTTP/control plane
RUNTIME_ROLE=consumer  → NATS/event consumption
RUNTIME_ROLE=worker    → queue/background execution
RUNTIME_ROLE=scheduler → scheduled orchestration
```

Roles share domain modules but may scale independently. Worker roles must implement bounded concurrency, idempotency, retry budgets, DLQ/reconciliation where applicable, readiness and graceful shutdown.

## Validation/API

Use one repository-standard schema validation mechanism. NestJS provides `ValidationPipe` and Standard Schema support; do not create parallel validation systems inside individual services. OpenAPI remains a versioned public HTTP contract and runtime validation remains mandatory. citeturn2search4turn2search0

## Lifecycle/reliability

All services enable appropriate shutdown hooks, drain transports, stop accepting new work, release connections and complete/requeue in-flight work safely. NestJS lifecycle hooks are the standard mechanism for process termination integration. citeturn2search1

## Observability

Standards require central redaction, tenant context, request/correlation/trace IDs and W3C trace propagation. OpenTelemetry semantic conventions are preferred. High-cardinality IDs do not become unbounded metric labels. Secrets never enter source, artifacts or telemetry.

## Infrastructure

Docker is the standard packaging boundary for Node/NestJS service and worker roles where container deployment is selected. Terraform is the standard infrastructure-as-code boundary for durable cloud resources and environment configuration. Cloudflare Worker resources remain provider-native but must be represented in the infrastructure plan.

## Enforcement

CI checks package shape, service boundaries, exports, dependency graph, runtime-safe imports, canonical environment identifiers, secret patterns, formatting, linting, typecheck, tests, contract compatibility and Changesets. Exceptions require an ADR.

## Testing

Every service role requires unit, integration, contract, end-to-end, security, failure/recovery, concurrency and readiness/shutdown coverage appropriate to its responsibilities. Real NATS/queue/database/provider integrations are required in adapter/conformance suites.

## Exit criteria

A new package or service can be implemented without architectural invention; CI rejects boundary, export, environment, contract and security violations; asynchronous processing has an explicit owning service; and every signal concern has exactly one authoritative owner.

## Cross-references

`.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`, `.kiro/plans/01-global/service-worker-architecture.md`, `.kiro/plans/01-global/infrastructure-docker-terraform.md`, `.kiro/plans/01-global/monitoring-infrastructure.md`, `.kiro/plans/services/README.md`, `.kiro/plans/packages/README.md`.
