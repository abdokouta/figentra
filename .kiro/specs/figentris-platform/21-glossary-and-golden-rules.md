# 21 — Glossary & Golden Rules

**Status:** Baseline
**Owner:** Platform architecture
**Related:** every spec (this is the one-page contract)

---

## 1. Purpose

The canonical vocabulary + the non-negotiable architecture constraints. Every
change to the platform must respect the golden rules. When a detailed spec and
this page appear to conflict, the detailed spec governs the specifics; this page
governs the invariants.

---

## 2. Glossary

| Term | Meaning |
| ---- | ------- |
| **Figentra** | The company / commercial parent. Top of the billing hierarchy. |
| **Figentra** | The platform product specified here. |
| **Actor** | Any authenticated caller: User, Service Account, System, or Integration Actor ([02]). |
| **User** | A human identity (Supabase Auth). |
| **Service Account** | Tenant-owned automation credential ([02], [04]). |
| **System actor** | A platform service acting on its own behalf ([09]). |
| **Integration Actor** | An installed third-party integration acting for a tenant ([07]). |
| **Supabase Auth Organization** | Identity/access org (Supabase Auth-owned). |
| **Tenant** | Figentra business/resource ownership boundary (`ten_…`) ([03]). |
| **Application** | An independent Figentra product (CRM, Commerce, …) ([06]). |
| **Integration** | A connection to a third-party system ([07]). Not an application. |
| **Permission** | IAM: can the actor do the action? ([04]). |
| **Entitlement** | Monetization: did the tenant buy the capability? ([05]). |
| **Quota** | Monetization: how much per period? ([05 §6]). |
| **Rate limit** | Edge/gateway: how fast? ([08 §6]). |
| **Usage** | Monetization: how much consumed? ([05 §8]). |
| **Billing account** | Node in the billing hierarchy; has a payer ([05 §4]). |
| **Payer** | The account financially responsible (may be an ancestor) ([05 §4.2]). |
| **Command** | A request to change state ([11 §2]). |
| **Domain event** | A completed business state transition ([11 §2]). |
| **Audit event** | A compliance record of who did what ([11 §2], [17 §7]). |
| **Workflow** | Orchestration of multi-step work ([11 §7]). Not an event. |
| **Outbox** | Table that stores domain events in the aggregate's transaction ([10 §4], [11 §4]). |
| **Manifest** | An application's or integration's declared platform metadata ([06 §5], [07 §6]). |
| **Plane** | A horizontal grouping of services (Control, Application, Platform services, Operations, …) ([01 §1]). |
| **Worker** | Cloudflare edge/lightweight runtime (Hono) ([15 §2.1]). |
| **Container** | Cloudflare Container runtime for substantial services (NestJS) ([15 §2.2]). |
| **RequestIdentityContext** | Server-derived, trusted per-request identity ([02 §4]). |
| **RLS** | Supabase Row Level Security — tenant-isolation defense in depth ([14 §5]). |
| **P0 / P1 / P2** | Capability priority tiers ([20 §3]). |

### 2.1 Reject-list (words that must not drift in)

- Do not call an **integration** an "application" (or vice versa) — [07 R-9].
- Do not call the **Monetization** service "subscription-service" or "commerce"
  — [05 §1].
- Do not use **Next.js** as "the frontend framework" — it is Vite + RR7 — [13 R-1].
- Do not say **"workspace"** as a domain word for tenant — the domain word is
  **Tenant**.

---

## 3. Golden rules (non-negotiable)

1. **Supabase Auth owns authentication.** Never re-implement it ([02]).
2. **Figentra owns platform authorization.** IAM decides permissions ([04]).
3. **Supabase Auth Organization and Figentra Tenant are related but distinct** ([03]).
4. **Tenant owns the domain/routing relationship** initially ([03]).
5. **Application Registry is lightweight** — Worker + D1/KV ([06]).
6. **Applications own their own business logic and data** ([06], [10]).
7. **Monetization owns plans, subscriptions, billing, entitlements, metering,
   usage** initially ([05]).
8. **Permissions and entitlements are different concepts** ([04 §3], [05 §6]).
9. **Never trust tenant/application/user identifiers supplied by the client**
   ([02 §4], [17 §3]).
10. **Use Supabase RLS for defense-in-depth tenant isolation** ([14 §5]).
11. **Do not split every domain concept into a microservice** ([00 §6.10]).
12. **TypeScript/Node.js is the default backend language** ([15]).
13. **NestJS for substantial services; Workers/Hono for edge** ([15 §2]).
14. **Go is an optimization/extraction choice, not the default.**
15. **Python is reserved for the AI service and model tooling** — not a
    general backend language.
16. **No service writes another service's database** ([09 §3], [14 §3]).
17. **Prefer APIs/events between bounded contexts** ([09]).
18. **Extract services only for a measurable reason** ([00 §6.10], [20 §5]).
19. **Keep Supabase Auth JWT claims small** ([02 §5]).
20. **Adding a new application must not require redesigning identity, tenant,
    billing, or IAM** ([06 §7], [13 §6]).

### 3.1 Reconciliation golden rules (this set)

21. **Frontend is Vite + React Router v7** — not Next.js by default; no Refine,
    no SDUI (R-1, [13]).
22. **Figentra is not a deployment PaaS** — Terraform is the deploy plane;
    Wrangler deploys artifacts (R-2, [15]).
23. **Billing hierarchy is separate from org hierarchy**; payer ≠ owner is
    modeled explicitly (R-3, [05 §4]).
24. **MikroORM** (`defineEntity` + class) is the ORM (R-4, [10 §5]).
25. **Write path is Controller → Command/Query → Use Case → Domain → Repository
    → Outbox → Events** (R-5, [10 §3]).
26. **Commands, domain events, and audit events are distinct; delivery uses a
    transactional outbox + idempotent consumers** (R-6, [11]).
27. **Queues for simple async, Cloudflare Workflows for durable orchestration,
    `@figentra/workflows` for the domain workflow API** (R-7, [11 §7]).
28. **Four actor types flow through one IAM model** (R-8, [02 §3]).
29. **Applications ≠ Integrations; the Integration Platform is first-class**
    (R-9, [07]).
30. **Versioning is platform-wide via `@figentra/versioning`** — REST,
    webhooks, events, workflows, SDK, manifests (R-10, [12]).

---

## 4. The one-sentence architecture

> **One identity, many organizations, many tenants, many applications;
> application-specific roles and permissions; tenant-specific entitlements;
> independent, tenant-isolated application data — on a Cloudflare-native
> substrate, provisioned by Terraform, with Supabase Auth for identity and Stripe/Paddle
> behind a billing adapter.**

This is the baseline every future Figentra service and application follows
unless an ADR supersedes it.

---

## 5. Change control

- This specification set is the source of truth over the `.ref/` documents.
- A material change lands as an **ADR** that references the affected spec(s) and,
  where relevant, updates the [README reconciliation table](README.md#4-reconciliation-decisions-conv-vs-arch-doc)
  and the [open-questions register](README.md#7-consolidated-open-questions-register).
- The open questions **O-1 … O-7** should be resolved with the product owner
  before or during the phase that depends on each.

---

## 6. Open questions (consolidated pointer)

See the [README §7 register](README.md#7-consolidated-open-questions-register).
Summary: O-1 package naming · O-2 org↔tenant cardinality · O-3 payment processor
· O-4 billing-responsibility timing · O-5 Infra Orchestrator API scope ·
O-6 data-residency regions · O-7 first application.
