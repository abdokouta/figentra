# Observability signals — three signals, two transports

Rules for where each observability signal lives + how it travels between the
service that emits it and the central observability plane that stores /
visualises it. Three canonical signal types, two distinct transports. The choice
per signal is architectural, not per-package.

## Precedence

1. This file wins over any ad-hoc "just push to observability" instinct.
2. Cross-references:
   - `.kiro/steering/hierarchy.md` §11 — the two-signal audit/activity boundary
     (extended here to three signals).
   - ADR-0065 — central observability via SDK for audit + activity.
   - ENT-P2-04 — the OTel tracing package landing.

## The three signals

| Signal       | Character                                                 | Loss tolerance                          |
| ------------ | --------------------------------------------------------- | --------------------------------------- |
| **Traces**   | Unique-per-request spans (distributed request lifecycle). | Semi-tolerant — sampled anyway.         |
| **Audit**    | Compliance evidence (one row per privileged action).      | INTOLERANT — losing one = evidence gap. |
| **Activity** | Product feed (one row per user-visible action).           | Semi-intolerant — user-facing.          |

Each signal's loss tolerance drives its transport choice.

> **Aggregates (rates, gauges, histograms) are NOT a workspace-owned signal.**
> The workspace ships no metrics package. Aggregate observation is delegated to
> two substrates that every service composes:
>
> - **Cloudflare Workers Analytics Engine + Observability** — aggregates request
>   rates, latency percentiles, CPU time, sub-request counts, per-route error
>   rates. Emitted from the Worker runtime; queried via GraphQL / the Cloudflare
>   dashboard.
> - **Sentry** (`@sentry/*` JS SDK) — error tracking + performance monitoring.
>   Aggregates exceptions, transaction spans, release health. Push-based to the
>   hosted Sentry backend.
>
> No workspace package defines a shared metrics vocabulary. Any service that
> needs a per-op aggregate writes to the Analytics Engine binding directly or
> calls the Sentry SDK's `metrics` API — no cross-package metrics contract.

## The two transports

### Transport 1 — PUSH via OTLP (OpenTelemetry Protocol)

**Used by: Traces.**

Every service pushes spans to an OTLP receiver (`stackra/otel` package, when it
lands per ENT-P2-04). Batch export with retry, gzip compression. Sampling ratio
controlled at emit time (default 10% in prd, 100% in dev/staging).

Advantages of push for traces:

- Traces are per-request, not aggregates — every span must reach the collector
  or be sampled-out at emit time.
- OTLP batch + retry semantics handle transient collector failure without losing
  high-value spans.
- Standard across every OTel-compliant backend (Tempo, Jaeger, Honeycomb,
  Datadog, ...).

### Transport 2 — PUSH via typed SDK (workspace HTTP)

**Used by: Audit + Activity.**

Every service that emits audit / activity rows pushes them over the wire via
`@stackra/observability-audit-sdk` / `@stackra/observability-activity-sdk`
(ADR-0065). The central observability service persists to Supabase Postgres.
Retry

- dead-letter handled by the SDK's HTTP connector.

Advantages of SDK push for audit + activity:

- Individual rows, not aggregates — must reach central store OR go to
  dead-letter queue (never dropped silently).
- Central storage enables cross-service compliance queries + retention policy
  - admin CRUD without per-service DB access.
- Same tenant / application / scope attribution contract (three-axis per
  `.kiro/steering/tenancy-columns.md`) end-to-end.

## Rule 1 — traces use OTLP push

`stackra/otel` handles this (once landed). Every service that opts into tracing
sets:

- `OTEL_EXPORTER_OTLP_ENDPOINT` — collector endpoint.
- `OTEL_SERVICE_NAME` — service identifier.
- `OTEL_TRACES_SAMPLER_ARG` — sampling ratio (default 0.1).

No workspace-specific SDK — OpenTelemetry's OTLP is the wire format. When
`OTEL_ENABLED=false` OR the SDK isn't installed, the tracer falls back to noop
(zero cost).

## Rule 2 — audit + activity use typed SDK push

Per ADR-0065:

- Every service EMITS audit + activity rows via
  `@stackra/observability-{audit,activity}-sdk`.
- The central observability service RECEIVES + persists.
- Retry + dead-letter live in the SDK's HTTP connector.
- No service creates local `audits` OR `activity_log` tables (except the
  observability service itself, which IS the central store).

## Rule 3 — aggregates go to Analytics Engine or Sentry, never to a workspace bus

The workspace defines no metrics contract. When a service needs per-operation
aggregation:

- **Application-level aggregates** (request rates, latencies, DB timings, queue
  depths) — Cloudflare Workers Analytics Engine + Observability collect these
  automatically for every Worker. No package code needed.
- **Error aggregates** (exception counts by class, per-release regressions) —
  Sentry collects these automatically for every service that installs the
  `@sentry/*` SDK. Same story.
- **Business aggregates** (custom counters — "orders placed today", "sign-ups by
  tenant") — write them as domain events (Lane 3 per
  `.kiro/steering/communication-patterns.md`) or persist to a domain aggregate.
  Never invent a fourth workspace-owned metrics surface.

## Rule 4 — uptime + on-call + status page = OneUptime

Uptime probes, incident routing, on-call schedules, escalation cascades, and the
public status page are covered by ONE vendor — OneUptime. It is the
workspace-canonical substrate for the SLA layer, retired the prior Better
Stack + PagerDuty split per
[ADR-0081 §Amendment 2026-08-08](../../.docs/adr/0081-observability-consolidation-and-api-gateway.md)

- the master plan §Wave 9.

* **Uptime probes** — `oneuptime_monitor` resources (Website / Ping / API / SSL
  / Manual / Server / Incoming Request). Every service's `/healthz` endpoint
  gets at least one probe via the observability composite Registry module
  ([`figentra/observability/figentra`](https://registry.terraform.io/modules/figentra/observability/figentra)).
* **On-call + escalation** — `oneuptime_on_call_policy` +
  `oneuptime_escalation_rule` resources, wired per service by the
  `oneuptime-service` sub-module.
* **Public status page** — one workspace-shared page (e.g.
  `status.figentra.com`) that links every service's monitors via the shared
  `oneuptime_label_id`.
* **Incident lifecycle** — `oneuptime_incident_severity` +
  `oneuptime_incident_state` taxonomies live in the workspace-level bootstrap;
  monitors auto-create incidents on failure per `oneuptime_page_on_incident`
  semantics.

Only the SLA layer flows through OneUptime. Domain-facing signals (audit rows,
activity rows, traces, error events, APM aggregates) travel on the substrate
rules above (Sentry + Cloudflare Analytics Engine + the
`@stackra/observability-{audit,activity}-sdk` client SDKs).

## Rule 5 — logs are stack-dependent

Logs are outside this doc's scope, but the shape is:

- Grafana Loki: pull (via Promtail agents).
- ELK / OpenSearch: push (via Filebeat / Vector).
- CloudWatch Logs: push (via IAM-scoped writes).

Pick per deployment. The workspace's default (`@stackra/logger`) writes to
stdout; the Cloudflare Workers runtime forwards to whichever log aggregator the
platform ships (Logpush / `wrangler tail` → the configured sink).

## Rule 6 — never conflate signals across transports

Each signal travels on its assigned transport. Cross-signal shortcuts are
review-blocking findings.

Forbidden:

- **An audit row pushed as an aggregate metric.** Metrics are aggregates
  (Analytics Engine / Sentry handle them); audit rows are compliance evidence
  (SDK handles them). Losing an audit row = losing evidence.
- **A span used as a log substitute.** Spans have sampling — they're not
  reliable for "every event happened once". Logs are.
- **Aggregating audit rows into a counter for compliance queries.** Query the
  central `audits` table — audit is per-row, not per-count.
- **Emitting a business fact as an aggregate metric.** APM aggregates are for
  application performance, not domain state. Use domain events (Lane 3) or
  persist to a domain table.

## Cross-references

- `.kiro/steering/hierarchy.md` §11 — audit / activity distinction.
- Observability adapters are stateless — Cloudflare Workers are stateless per
  request; never hold cross-request state in an adapter.
- `.kiro/steering/tenancy-columns.md` — three-axis attribution contract that
  audit + activity emit under.
- `.kiro/steering/communication-patterns.md` §Lane 3 — domain events for
  business-fact fan-out.
- ADR-0032 — six-service split (observability-service is the central store).
- ADR-0065 — central observability via SDK.
- ENT-P2-04 — OTel tracing package landing.

## Anti-patterns

| Anti-pattern                                                  | Correct                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Reintroducing a workspace metrics package                     | Use Cloudflare Analytics Engine + Sentry. Aggregates are not a workspace-owned signal. |
| Emitting a business fact as an aggregate metric               | Emit a domain event (Lane 3) or persist to a domain aggregate table.              |
| Pushing audit rows to an aggregate metric as counters         | Audit rows travel via `@stackra/observability-audit-sdk` — one row = one push.    |
| Aggregating audit rows into counter for compliance queries    | Query the central `audits` table — audit is per-row, not per-count.               |
| Using traces to replace logs                                  | Traces are sampled; logs aren't. Pick per concern.                                |
| Defining a shared metrics counter/gauge vocabulary in a package | There is no workspace metrics contract. Delegate to Analytics Engine / Sentry.  |
