# Figentra Platform — Specification Set

**Status:** Baseline (v1) **Date:** 2026-08-30 **Authoring source:**
`.ref/FIGENTRA_PLATFORM_ARCHITECTURE.md` (v1.1) + `.ref/conv.txt` (decision log)
**Location rationale:** lives in `.kiro/specs/` alongside the repo's other
specs; distinct from the legacy `.kiro/specs/platform-architecture/`
(pre-TypeScript Figentra lineage).

---

## 0. What this is

This folder is the **authoritative, sectioned specification** for the Figentra
platform. It reconciles the two reference documents into one coherent set:

- `.ref/FIGENTRA_PLATFORM_ARCHITECTURE.md` — the master architecture doc (v1.1).
- `.ref/conv.txt` — the decision log that refined and, in places, corrected it.

Where the two disagreed, this set records the **resolved** decision (see the
[reconciliation table](#4-reconciliation-decisions-conv-vs-arch-doc)) and treats
this specification — not the reference docs — as the source of truth going
forward.

These are **specifications, not implementation**. No deployable trees are
created by this set. Per the workspace `AGENTS.md`, deployable roots (`apps/`,
`workers/`, `services/`, `applications/`, `packages/`) stay absent until their
first real implementation.

---

## 1. Naming resolution (read first)

The reference material used "Figentra" and "Figentra" interchangeably. This set
pins the following meanings and uses them consistently:

| Term           | Meaning                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Figentra**   | The company / commercial parent (Figentra Tech LLC). Top of the billing hierarchy.            |
| **Figentra**   | The **platform product** being specified here (the multi-tenant, multi-application platform). |
| **Academorix** | A product/reseller account operating on Figentra (example commercial child).                  |
| **Barcelona**  | An example customer organization under a reseller.                                            |
| **Parent**     | The end payer / responsible billing account in a hierarchy example.                           |

Package scope is `@figentra/*`. Where the reference frontend note said "Stackra
UI / Stackra Query", this set treats those as the **design-system and data-layer
packages** the frontend composes (documented in
[13-frontend-architecture](13-frontend-architecture.md)); the platform packages
themselves are `@figentra/*`.

> Open question **O-1**: confirm whether the shipped design-system/query
> packages are literally `@stackra/*` or `@figentra/*` equivalents. Specs assume
> `@figentra/ui` + `@figentra/query` and note where the reference said
> otherwise.

---

## 2. Document map

Read in order for a first pass; jump by domain thereafter.

| #   | Document                                                               | Scope                                                                                                            |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 00  | [Overview & principles](00-overview-and-principles.md)                 | Purpose, platform model, golden abstractions, what Figentra is / is not.                                         |
| 01  | [Platform architecture](01-platform-architecture.md)                   | The planes, high-level topology, DNS/subdomain strategy, service inventory.                                      |
| 02  | [Identity & actors](02-identity-and-actors.md)                         | Supabase Auth, the four actor types, request identity context, token strategy.                                   |
| 03  | [Tenancy & domains](03-tenancy-and-domains.md)                         | Supabase Auth-org ↔ tenant mapping, tenant lifecycle, domains, hostname resolution.                              |
| 04  | [IAM & authorization](04-iam-and-authorization.md)                     | Roles, permissions, policy engine, authorization flow, permission≠entitlement.                                   |
| 05  | [Monetization & hierarchical billing](05-monetization-and-billing.md)  | Catalog, plans, subscriptions, billing, entitlements, metering, usage, credits, billing hierarchy.               |
| 06  | [Application Registry](06-application-registry.md)                     | Application metadata, versions, environments, capabilities, branding.                                            |
| 07  | [Integration Platform](07-integration-platform.md)                     | Applications ≠ Integrations; marketplace; install/connect/configure/pause.                                       |
| 08  | [API Gateway](08-api-gateway.md)                                       | Edge entry, routing, token prevalidation, rate limiting, correlation.                                            |
| 09  | [Service communication](09-service-communication.md)                   | Sync/async, service identity, event envelope, bindings, worker→container.                                        |
| 10  | [Domain & application patterns](10-domain-and-application-patterns.md) | Resource controllers, Command/Query→UseCase→Domain→Repository→Outbox, MikroORM.                                  |
| 11  | [Events & workflows](11-events-and-workflows.md)                       | Command/domain/audit events, transactional outbox, idempotency, Queues vs CF Workflows vs `@figentra/workflows`. |
| 12  | [Versioning](12-versioning.md)                                         | `@figentra/versioning`: REST, webhooks, events, workflows, SDK, manifests.                                       |
| 13  | [Frontend architecture](13-frontend-architecture.md)                   | Vite + React Router v7 + HeroUI Pro, portal, app frontends, dynamic launcher.                                    |
| 14  | [Data & persistence](14-data-and-persistence.md)                       | Storage matrix, DB-per-service, tenant isolation, Supabase RLS, residency, DR.                                   |
| 15  | [Infrastructure & IaC](15-infrastructure-and-iac.md)                   | Cloudflare Workers/Containers, Terraform/Wrangler boundary, Infra Orchestrator API.                              |
| 16  | [Observability](16-observability.md)                                   | OpenTelemetry, Better Stack, required metadata, logs/metrics/traces.                                             |
| 17  | [Security & compliance](17-security-and-compliance.md)                 | Security principles, service identity, quotas vs rate limits, compliance posture.                                |
| 18  | [Error model & API conventions](18-error-model-and-api-conventions.md) | Error envelope, error codes, pagination, idempotency, ID scheme.                                                 |
| 19  | [Environments & CI/CD](19-environments-and-cicd.md)                    | dev/staging/production, pipelines, deployment flow, promotion.                                                   |
| 20  | [Implementation roadmap](20-implementation-roadmap.md)                 | Phased build order, capability tiers (P0/P1/P2), what NOT to build.                                              |
| 21  | [Glossary & golden rules](21-glossary-and-golden-rules.md)             | Canonical vocabulary + the non-negotiable architecture constraints.                                              |

---

## 3. Canonical technology decisions (locked)

| Concern                          | Decision                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity                         | **Supabase Auth** (authoritative for auth, sessions, MFA, org membership).                                                                          |
| Edge / lightweight compute       | **Cloudflare Workers + Hono**.                                                                                                                      |
| Substantial services             | **Cloudflare Containers + Node.js 22 + NestJS**.                                                                                                    |
| ORM                              | **MikroORM** (`defineEntity` + class style; decorators selectively).                                                                                |
| Transactional relational         | **Supabase PostgreSQL** (per-service DBs/schemas).                                                                                                  |
| Registry / config data           | **Cloudflare D1** (+ KV where read-optimized).                                                                                                      |
| Object storage                   | **Cloudflare R2**.                                                                                                                                  |
| Async / queues                   | **Cloudflare Queues** (SQS only for AWS-native workloads; no Kafka yet).                                                                            |
| Durable multi-step orchestration | **Cloudflare Workflows** (fronted by `@figentra/workflows` domain API).                                                                             |
| Stateful coordination            | **Durable Objects** (only where strong consistency is required).                                                                                    |
| Frontend                         | **React + TypeScript + Vite + React Router v7** (+ HeroUI Pro + design-system + query lib). **Not** Next.js by default; **no** Refine, **no** SDUI. |
| Infrastructure as code           | **Terraform** (source of truth for durable infra + provider config).                                                                                |
| App deploy artifacts             | **Wrangler** (Workers/Containers). Never fights Terraform for the same artifact.                                                                    |
| Terraform providers              | Cloudflare, Supabase Auth (`supabase/supabase`), Supabase, Better Stack (+ AWS escape hatch).                                                       |
| Observability                    | **OpenTelemetry + Better Stack** (Sentry where useful).                                                                                             |
| Payments                         | **Stripe / Paddle** behind a provider adapter (never in the domain).                                                                                |
| External compute                 | AWS/GCP/Azure = **escape hatch only** (GPU, huge memory, specialized networking).                                                                   |

---

## 4. Reconciliation decisions (conv vs arch doc)

Where `.ref/conv.txt` and `.ref/FIGENTRA_PLATFORM_ARCHITECTURE.md` diverged,
this set resolves as follows. Each row links to the doc that carries the detail.

| #    | Topic                  | Divergence                                                             | Resolution (this set)                                                                                                                        | Detail                                                                 |
| ---- | ---------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| R-1  | Frontend framework     | Arch §35 lists Next.js; §62/§87/§108 say Vite + RR7                    | **Vite + React Router v7** is canonical; the Next.js mention is retired                                                                      | [13](13-frontend-architecture.md)                                      |
| R-2  | PaaS scope             | conv proposed 50+ PaaS services, then cut them                         | Figentra is **not** a Heroku/Vercel deploy PaaS; **Terraform is the deploy plane**, optionally fronted by an Infrastructure Orchestrator API | [15](15-infrastructure-and-iac.md), [20](20-implementation-roadmap.md) |
| R-3  | Billing shape          | Arch §18 flat Tenant→BillingAccount; conv adds a commercial hierarchy  | **Hierarchical billing accounts** (parent/child, payer, billing responsibility) separate from org hierarchy                                  | [05](05-monetization-and-billing.md)                                   |
| R-4  | ORM                    | Arch silent; conv locks MikroORM                                       | **MikroORM** (`defineEntity` + class)                                                                                                        | [10](10-domain-and-application-patterns.md)                            |
| R-5  | Request/domain pattern | Arch silent; conv locks resource controllers + outbox                  | **Resource controllers → Command/Query → Use Case → Domain → Repository → Outbox → Events**                                                  | [10](10-domain-and-application-patterns.md)                            |
| R-6  | Events                 | Arch §97 envelope only; conv separates command/domain/audit + outbox   | Three event kinds + **transactional outbox** + idempotent consumers                                                                          | [11](11-events-and-workflows.md)                                       |
| R-7  | Workflows              | conv Medusa-inspired, then corrected to CF Workflows                   | Queues (simple async) / **CF Workflows** (durable) / `@figentra/workflows` (domain API)                                                      | [11](11-events-and-workflows.md)                                       |
| R-8  | Actors                 | Arch models only `userId`; conv locks 4 actor types                    | **User / Service Account / System / Integration Actor** all through one IAM model                                                            | [02](02-identity-and-actors.md)                                        |
| R-9  | Integrations           | Arch mentions "Integrations"; conv defines a full Integration Platform | **Applications ≠ Integrations**; a first-class Integration Platform + marketplace                                                            | [07](07-integration-platform.md)                                       |
| R-10 | Versioning             | Arch §55 basic `/v1`; conv locks `@figentra/versioning`                | Platform-wide versioning across REST/webhooks/events/workflows/SDK/manifests                                                                 | [12](12-versioning.md)                                                 |

---

## 5. Status legend

Each spec carries a status banner:

- **Baseline** — agreed target design; safe to build against.
- **Draft** — proposed; open questions remain.
- **Deferred** — recognized need, intentionally not designed in depth yet.

Every spec ends with an **Open questions** section (`O-n`) and, where relevant,
**Non-goals / anti-patterns**.

---

## 6. Conventions used across specs

- **Diagrams** are ASCII, matching the reference docs' style.
- **APIs** are illustrative REST shapes (`/v1/...`); exact schemas live in
  `@figentra/contracts` once implementation starts.
- **IDs** use domain-prefixed identifiers (`ten_`, `app_`, `sub_`, …); Supabase
  Auth IDs are never renamed. See [18](18-error-model-and-api-conventions.md).
- **"Service"** = a bounded context that may start as a module and be extracted
  later. Do not read "service" as "must be a separate deployment".

---

## 7. Consolidated open-questions register

Each is also restated in its home doc. Resolve with the product owner.

| ID  | Question                                                                                | Home doc                             |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| O-1 | Are design-system/query packages `@stackra/*` or `@figentra/*`?                         | [13](13-frontend-architecture.md)    |
| O-2 | Supabase Auth org ↔ tenant strictly 1:1 at launch, or 1:N allowed early?                | [03](03-tenancy-and-domains.md)      |
| O-3 | Which payment processor is primary at launch — Stripe or Paddle?                        | [05](05-monetization-and-billing.md) |
| O-4 | Does billing responsibility (payer ≠ owner) ship in v1 or v1.1?                         | [05](05-monetization-and-billing.md) |
| O-5 | Is the Infrastructure Orchestrator API in scope for v1, or Terraform-by-hand initially? | [15](15-infrastructure-and-iac.md)   |
| O-6 | Data-residency regions targeted at launch (EU / KSA / UAE / US)?                        | [14](14-data-and-persistence.md)     |
| O-7 | First application to build end-to-end (CRM / Commerce / other)?                         | [20](20-implementation-roadmap.md)   |

## Operational Signal Standard

- [22 — Unified Health, Observability, Telemetry, Logging & Operational Signals](22-health-observability-telemetry.md)
