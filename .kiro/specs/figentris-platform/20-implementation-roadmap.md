# 20 — Implementation Roadmap

**Status:** Baseline
**Owner:** Platform architecture
**Related:** [01 Architecture](01-platform-architecture.md), [15 Infrastructure & IaC](15-infrastructure-and-iac.md), all service specs

---

## 1. Purpose

Define the build order, the capability tiers (P0/P1/P2), and — explicitly — what
**not** to build. The roadmap reflects R-2 (no deployment PaaS) and the "extract
later" principle.

---

## 2. Phased build order

Build the control plane before applications. Each phase produces a usable
increment.

```text
Phase 1 — Identity
    Supabase Auth configured: users, orgs, MFA, auth, org selection, redirects
    identity.figentra.com

Phase 2 — Tenant (+ Domains)
    Supabase Auth org → tenant mapping, tenant lifecycle, config, domains, verification
    tenant.figentra.com

Phase 3 — IAM
    roles, permissions, application access, authorization API, (policy engine P1)
    iam.figentra.com

Phase 4 — Application Registry
    application registration, metadata, versions, environments, capabilities
    registry.figentra.com  (Worker + D1)

Phase 5 — Monetization
    products, plans, subscriptions, billing accounts (+ hierarchy), invoices,
    entitlements, usage, metering
    billing.figentra.com

Phase 6 — Portal
    org switcher, dynamic application launcher, tenant admin, members, billing,
    domains, security, settings
    app.figentra.com

Phase 7 — First application (end-to-end)
    Build ONE application fully and validate the whole model:
    auth · tenant resolution · IAM · entitlements · Supabase RLS · routing ·
    launch · audit · usage
```

Only after Phase 7 is correct should additional applications be added
(**O-7:** which application first).

---

## 3. Capability tiers

Beyond the phased control plane, cross-cutting capabilities are tiered by
priority. This is the reconciled, R-2-corrected version of the conv.txt list
(the deployment-PaaS items are removed).

### P0 — required for a serious platform

```text
Identity · Tenant · IAM · Application Registry · Monetization · Portal
API Gateway · Service communication + service identity
Domain patterns (controllers → outbox) · Events (envelope + outbox + idempotency)
Cloudflare Queues · Observability (OTel + Better Stack, /health + /ready)
Audit (baseline) · Error model + API conventions · Versioning (@figentra/versioning)
Terraform + Wrangler deploy · Environments (dev/staging/prod) · Secrets/config
Tenant isolation (server authz + RLS) · Idempotency (billing/webhooks)
```

### P1 — platform maturity

```text
Integration Platform (install/connect/configure/pause/disconnect)
Notifications service · Workflows (@figentra/workflows over CF Workflows)
Policy engine (contextual authorization) · Approval capability
Webhook platform (subscriptions/delivery/retry/replay/DLQ)
Usage extraction (usage-service behind a queue) · Event replay / DLQ management
Dependency-aware health · Incident/status (Better Stack) 
Data lifecycle enforcement · Data export/import · Access reviews · SCIM/SSO
Tenant-custom roles · Billing responsibility (payer ≠ owner) depth
```

### P2 — differentiation

```text
Marketplace UI (+ Extensions / Connectors listing kinds)
AI Gateway (model registry, provider adapters, token/cost, routing, fallback)
AI Agent / Automation API (IAM-scoped service accounts drive controlled actions)
Infrastructure Orchestrator API (terraform-as-a-service surface) [O-5]
Experimentation (vs feature flags) · Advanced analytics / OLAP
Multi-region data residency enforcement · FinOps · Search platform depth
Reporting/analytics registries · Terraform provider for Figentra resources · GitOps
```

---

## 4. What NOT to build (explicit)

Deliberately out of scope — compose existing primitives instead:

```text
✗ Custom container orchestrator          ✗ Custom container scheduler
✗ Custom identity system                 ✗ Custom SDUI
✗ Custom ORM                             ✗ Custom message broker
✗ Custom object storage                  ✗ Custom feature-flag engine
✗ Custom CDN                             ✗ Custom DNS
✗ Custom payment processor               ✗ Custom email provider
✗ Figentra Build / Artifact / Deployment / Preview-env PaaS services (R-2)
✗ Kafka (until volume genuinely justifies it)
✗ A deployment-PaaS control plane        ✗ Micro-frontend module federation (day one)
```

Cloudflare (Workers, Containers, Queues, Workflows, R2, KV, Durable Objects,
Hyperdrive) + Supabase + Supabase Auth + Stripe/Paddle provide the substrate. Terraform
provisions it; Wrangler deploys artifacts.

---

## 5. Sequencing rules

- **Control plane before applications.** An application cannot be validated
  before identity/tenant/IAM/entitlements exist.
- **Contracts before consumers.** Publish `@figentra/contracts` for a domain
  before another service consumes it ([09 §8]).
- **Events designed in from P0.** Even if consumers are few, emit domain events
  via the outbox so services can be extracted later without redesign
  ([11 §9]).
- **Extract only on a measurable reason** ([00 §6.10]) — independent scaling,
  ownership, security boundary, volume.
- **Deferred ≠ undesigned.** P1/P2 capabilities have their data shapes stubbed
  now where cheap (e.g. `access_policies`, `billing_accounts.payer`,
  `tenants.region`) so they slot in without migrations.

---

## 6. Definition of done for Phase 7 (model validation)

The first application is "correct" when a real request proves every seam:

```text
POST https://<app>.figentra.com/api/...  with a Supabase Auth token
  1. Supabase Auth identity validated
  2. active organization resolved
  3. organization → tenant mapped (trusted)
  4. application resolved (hostname/route)
  5. IAM permission check passes
  6. Monetization entitlement check passes
  7. business logic executes
  8. query is tenant-isolated (server scope + RLS)
  9. audit + usage events emitted (via outbox)
```

If any step is faked or bypassed, Phase 7 is not done.

---

## 7. Open questions

- **O-7** — Which application is built first in Phase 7 (CRM / Commerce / other)?
- **O-5** — Whether the Infrastructure Orchestrator API (P2) is pulled earlier.
- Confirm P0 audit depth (full audit service vs. minimal audit-event stream at
  launch).
