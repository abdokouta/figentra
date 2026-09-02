# 08 — API Gateway

**Status:** Baseline
**Owner:** Platform edge
**Runtime:** Cloudflare Worker + Hono · **Domain:** `api.figentra.com`
**Related:** [09 Service communication](09-service-communication.md), [02 Identity & actors](02-identity-and-actors.md), [18 Error model & API conventions](18-error-model-and-api-conventions.md)

---

## 1. Purpose

The API Gateway is the **public entry point** to the platform API. It is a
thin edge layer — routing, edge authentication, rate limiting, correlation,
versioning, security policy. It contains **no business logic** and touches
**no** service database.

---

## 2. Responsibilities

**Gateway owns:**

- Public API entry (`api.figentra.com`)
- Request routing to internal services
- Authentication **prevalidation** (validate Supabase Auth token / PAT / service token
  shape + signature at the edge; full authorization stays in IAM)
- Rate limiting (edge, per the quota/rate-limit distinction in [05 §6])
- Correlation: assign/propagate `request_id` + `trace_id`
- API versioning routing (`/v1/...`)
- CORS policy
- Security headers
- Coarse-grained request policy / edge authorization prechecks

**Gateway must NOT:**

- Implement business logic
- Access any service's database directly
- Become a monolith that "knows" every domain
- Perform final authorization (that is IAM) or entitlement checks (Monetization)

---

## 3. Request pipeline

```text
Client
  │
  ▼
Cloudflare edge (DNS · WAF · CDN · TLS)
  │
  ▼
API Gateway (Worker + Hono)
  1. assign/propagate request_id + trace_id
  2. CORS + security headers
  3. edge rate limit (coarse)
  4. authn prevalidation (token signature/shape; reject clearly-invalid)
  5. resolve route → target service + version
  6. attach trusted service-to-service context (see [09])
  │
  ▼
Target service (IAM / Tenant / Monetization / Registry / Application)
  → full authorization (IAM) + entitlement (Monetization) + business logic
```

The gateway rejects clearly-unauthenticated/invalid requests early, but it does
**not** make the final allow/deny decision — it forwards a request the target
service authorizes definitively.

---

## 4. Routing model

- Route by **path + version** to the owning service:
  `POST /v1/authorization/check` → IAM; `GET /v1/resolve` → Tenant;
  `GET /v1/plans` → Monetization; `GET /v1/applications` → Registry.
- Prefer **Cloudflare service bindings** for Worker→Worker targets (Registry,
  Gateway-adjacent Workers); use the Worker-in-front pattern for Container
  targets (IAM/Tenant/Monetization) — see [09](09-service-communication.md).
- Internal services are **not** publicly routable except through the gateway (or
  their own subdomain when a real external use case exists — [01 §3]).

---

## 5. Edge authentication vs. authorization

| Concern            | Where            | What                                                        |
| ------------------ | ---------------- | ---------------------------------------------------------- |
| **Prevalidation**  | Gateway (edge)   | Token present? Signature valid? Not expired? Shape correct?|
| **Authentication** | Supabase Auth / IAM      | Establish the actor.                                       |
| **Authorization**  | IAM              | Can this actor do this action? ([04])                      |
| **Entitlement**    | Monetization     | Did the tenant buy it? ([05])                              |

The gateway's edge check is a fast-fail optimization, never the security
boundary.

---

## 6. Rate limiting

- Coarse, edge-level rate limiting lives at the gateway (and Cloudflare WAF).
- Fine-grained **quota** (per period) and per-tenant **rate limits** are
  entitlement-driven values owned by Monetization ([05 §6]); the gateway reads
  the tenant's `api.requests_per_minute` entitlement to parameterize its limit.
- Rate-limit responses use `429` + the standard error envelope
  ([18](18-error-model-and-api-conventions.md)) with `RATE_LIMITED`.

---

## 7. Versioning at the edge

- Public API is versioned in the path: `/api/v1/...`.
- The gateway routes each version to the correct service version; a new major
  version is a new route surface, not an in-place break.
- Deprecation/sunset headers are applied per [12 Versioning](12-versioning.md).

---

## 8. Correlation & observability

- Every request gets a `request_id` (`req_...`) if absent, and a `trace_id`
  (`trace_...`) is created/propagated.
- These flow to every downstream service and into logs/traces
  ([16](16-observability.md)).
- The gateway emits access logs with method, route, status, duration,
  `tenant_id` (once resolved), and correlation IDs — never secrets or tokens.

---

## 9. Non-goals / anti-patterns

| Anti-pattern                                             | Correct                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| Business logic in the gateway                            | Edge concerns only; forward to the owning service.        |
| Gateway reading a service DB                             | Route to the service; the service owns its DB.            |
| Final authorization at the edge                          | Prevalidate only; IAM authorizes.                         |
| Exposing every internal service publicly                 | Behind the gateway unless externally needed.              |
| Trusting client-supplied identity headers                | Derive/attach trusted context; strip inbound spoofed ones.|
| A monolithic gateway that imports every domain           | Thin routing + policy layer.                              |

---

## 10. Open questions

- Confirm whether the gateway parameterizes rate limits from live Monetization
  entitlements (a per-request lookup + cache) or from a periodically-synced
  projection.
