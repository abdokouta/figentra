---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra global engineering standards — enterprise plan

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0088, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** repository steering, all package plans and ADR index  
**Design effort:** 14 days across 8 phases

## Purpose

Single enforceable standard for naming, package boundaries, TypeScript, build/test manifests, dependency direction, contracts, DI, discovery, configuration, environments, security, observability, documentation and releases.

## Locked standards

`src/` is the source root; Node >=22; TypeScript strict; tsup builds publishable packages; Vitest is the standard test runner except explicitly documented RN exceptions; explicit exports are mandatory; cross-package JIT is forbidden; internal deps use workspace protocols; third-party versions use catalogs. Core packages are runtime-neutral and runtime-specific APIs stay under runtime subpaths.

Canonical vocabulary is defined once in `@stackra/contracts`. Discovery is find → registry → populator/factory. Driver-based packages use `Manager`/`MultipleInstanceManager` per ADR-0090. Environment identifiers are exactly `development`, `staging`, `production` per ADR-0088.

## Identity standard

Authentication and identity are one bounded context exposed by `@stackra/identity`. Supabase Auth is the day-one human authentication provider. The identity package owns provider adapters, verification, principal normalization, session/credential references, service identities and explicit identity context. IAM/Policy owns authorization. A standalone `@stackra/auth` package is not part of the target dependency graph.

## Signal ownership standard

| Concern | Owner | Boundary |
|---|---|---|
| Logs | `@stackra/logger` | structured operational/application diagnostics |
| OpenTelemetry context/instrumentation | `@stackra/observability` | traces, metrics, propagation, exporters |
| Monitoring | infrastructure/operations | collectors, backends, dashboards, alerts, SLOs |
| Audit | audit capability/service | durable accountability records |
| Tracking | `@stackra/tracking` | product/campaign/ad behavioral events + consent |
| Analytics | `@stackra/analytics` | durable analytical ingestion, aggregation, attribution, queries |
| Marketing | `@stackra/marketing` | campaigns, audiences, activation, server-side conversions |
| Usage | Usage service | billable metering |
| Domain events | `@stackra/events` | business facts |

Logs, traces, metrics, audit, tracking, analytics and marketing MUST NOT be treated as one generic telemetry stream. They have different owners, retention, privacy, sampling and access semantics.

## Runtime standard

Capabilities describe behavior and remain runtime-neutral. NestJS is the normal control-plane API runtime. Workers execute asynchronous data-plane work such as ingestion, aggregation, scheduled campaigns, notification delivery, indexing and provider integrations. Cloudflare Workers handle edge/control workloads where the platform constraints fit.

A package plan must identify synchronous control-plane operations separately from asynchronous worker operations; "has a NestJS API" does not make the capability NestJS-only.

## Subpath/file layout

```text
.kiro/steering/                  # normative rules
.docs/adr/                       # accepted decisions
.kiro/plans/                     # implementation contracts
packages/*/src/core/             # runtime-neutral core
packages/*/src/{nestjs,react,native,worker}/
```

## Enforcement

CI checks package shape, exports, dependency graph, runtime-safe imports, canonical environment identifiers, secret patterns, formatting, typecheck, tests and Changesets. Standards are fail-closed; exceptions require an ADR.

## Security / observability

Standards require central redaction, tenant context, request/correlation/trace IDs, W3C trace propagation, bounded inputs and audit events for privileged actions. OpenTelemetry semantic conventions are preferred for telemetry names and attributes. Secrets never enter source, artifacts or telemetry.

## Testing / compatibility

Every standard has an executable conformance check. Changes to standards require migration guidance and impact inventory; no silent compatibility shim is permitted.

## Phases

1. consolidate standards (2d); 2. dependency/package rules (2d); 3. runtime/subpath rules (2d); 4. identity/signal ownership rules (2d); 5. security/observability rules (2d); 6. CI enforcement (2d); 7. exception/migration process (1d); 8. docs/release (1d).

## Exit criteria

A new package can be scaffolded from standards without architectural invention; CI rejects boundary, export, environment and security violations; and every telemetry/identity concern has exactly one authoritative owner.

## Cross-references

`2026-09-03-enterprise-day-one-plan-standard.md`, `2026-09-03-enterprise-observability-plan.md`, `2026-09-03-identity-package.md`, `2026-09-03-tracking-package.md`, `2026-09-03-analytics-package.md`, `2026-09-03-marketing-package.md`, `.kiro/steering/package-conventions.md`, ADR-0088/0090/0091/0092.
