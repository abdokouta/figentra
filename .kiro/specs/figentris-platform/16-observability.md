# 16 — Observability

**Status:** Baseline (core), Deferred (FinOps, status page, incident tooling
depth) **Owner:** Operations plane **Related:**
[09 Service communication](09-service-communication.md),
[17 Security](17-security-and-compliance.md),
[11 Events & workflows](11-events-and-workflows.md)

---

## 1. Purpose

Define the observability standard: telemetry via OpenTelemetry, centralized on
Better Stack, the required metadata every signal carries, and the distinction
between the observability signals. This is the Operations plane's core.

---

## 2. Signals

Five first-class signals — **logs, metrics, traces, events, audit** — not just
"logging". They are conceptually distinct:

| Signal  | Answers                                    | Owner / store               |
| ------- | ------------------------------------------ | --------------------------- |
| Logs    | What happened, in detail?                  | Better Stack (via OTel)     |
| Metrics | How much / how fast / how healthy?         | Metrics backend / Analytics |
| Traces  | Where did this request go across services? | OTel + Better Stack/Sentry  |
| Events  | What business facts occurred? ([11])       | Event stream / archive (R2) |
| Audit   | Who did what, when? (compliance) ([17])    | Audit store                 |

Events and audit are **separate** from operational logs — different retention,
consumers, and query patterns.

---

## 3. Standard: OpenTelemetry + Better Stack

- **OpenTelemetry** is the application-level telemetry standard for traces,
  metrics, and log correlation.
- **Better Stack** is the initial centralized observability platform (logs,
  uptime, tracing/monitoring, incidents, on-call, status page). It ingests from
  JS/Node, Cloudflare, Docker, and other sources, and is Terraform-managed ([15
  §5]).
- **Sentry** where useful (error tracking).
- **Cloudflare observability** for Workers-native signals.

Terraform manages Better Stack: monitors, heartbeats, telemetry sources,
dashboards, alerts, on-call, status pages.

---

## 4. Required metadata

Every service emits, on every signal where applicable:

```text
service          version         environment
request_id       trace_id        span_id (traces)
user_id          tenant_id       application
operation        status          duration
correlation_id   actor_id / actor_type
```

- `request_id` / `trace_id` are assigned/propagated by the gateway ([08 §8]) and
  flow through every downstream hop.
- One `trace_id` follows an operation across gateway → IAM → application →
  Postgres → notification.

**Never log:** passwords, raw tokens, secret keys, payment credentials, or
sensitive personal data beyond what is necessary ([17 §Logging]).

---

## 5. Tracing example

```text
Request
 ↓  trace_id = trace_abc
Gateway
 ↓
IAM (authorization check)
 ↓
Commerce (business logic)
 ↓
Workflow (if durable)
 ↓
Postgres
 ↓
Notification (async)
```

One `trace_id` lets an operator follow the entire operation end to end.

---

## 6. Metrics — platform vs business

Keep two metric families conceptually distinct:

| Platform metrics                           | Business metrics              |
| ------------------------------------------ | ----------------------------- |
| requests, latency, errors, CPU, memory     | orders, revenue, active users |
| queue depth, workflow duration, DB latency | subscriptions, conversions    |
| cache hit rate, billing-usage counts       |                               |

Business metrics derive from **events/usage** ([11], [05 §8]); do not compute
them by hammering production Postgres — feed an analytics path.

---

## 7. Health, readiness, and platform health

Every service exposes:

```text
GET /health      liveness
GET /ready        readiness
```

Beyond per-service checks, the platform tracks **dependency-aware** health:

```text
Service Health · Dependency Health · Environment Health · Deployment Health
```

so an operator sees "Commerce is degraded because Postgres latency increased",
not merely "Commerce is unhealthy". Dependency-aware health composition is a
**P1/P2** capability; per-service `/health` + `/ready` are baseline.

---

## 8. Incidents & status page

**Status: Deferred depth.** Recognized as needed; full incident tooling is P1/P2
([20]).

- **Status page** (e.g. `status.figentra.com`) — Better Stack status page,
  Terraform-managed.
- **Incident model** — incident, severity, affected services/regions, timeline,
  updates, resolution, postmortem. Baseline uses Better Stack incidents/on-call;
  a richer incident service is deferred.

---

## 9. FinOps (deferred)

**Status: Deferred (P2).** Figentra infrastructure cost tracking is a separate
concern from tenant billing ([05 §11]). FinOps (usage → cost → budget → forecast
→ alerts for Figentra's own Cloudflare/Supabase/Stripe/AI spend) is a P2
capability, distinct from the tenant-facing Monetization service.

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                               | Correct                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| "Just logging" instead of five distinct signals            | Logs / metrics / traces / events / audit are distinct. |
| Logging secrets / tokens / payment data                    | Redact; never log sensitive material.                  |
| Computing business metrics off production Postgres         | Derive from events/usage; feed analytics.              |
| Conflating platform metrics with business metrics          | Two distinct families.                                 |
| Merging tenant billing with Figentra FinOps                | Separate concerns ([05 §11], §9).                      |
| Health that only says "unhealthy" with no dependency cause | Dependency-aware health composition (P1/P2).           |

---

## 11. Open questions

- Confirm the metrics backend (Cloudflare Analytics Engine vs Better Stack
  telemetry vs a dedicated metrics store).
- Confirm when dependency-aware health + incident tooling promote from deferred
  to scheduled ([20]).
