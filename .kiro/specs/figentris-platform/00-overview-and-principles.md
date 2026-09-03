# 00 — Overview & Principles

**Status:** Baseline **Owner:** Platform architecture **Related:**
[01 Platform architecture](01-platform-architecture.md),
[21 Glossary & golden rules](21-glossary-and-golden-rules.md)

---

## 1. Purpose

Figentra is **not a single SaaS application**. It is a **platform that hosts
multiple independent applications** which share one identity, one tenancy model,
one authorization model, one monetization model, one application registry, and
one integration surface.

Each application (CRM, Commerce, POS, Analytics, …) owns its own business logic,
API, data model, deployment lifecycle, and UI — but **never** re-implements
identity, tenancy, billing, or platform authorization.

This document states the mental model and the principles every other spec obeys.

---

## 2. The seven separations

The platform is built by keeping seven concerns strictly separate. Conflating
any two of them is the most common design failure.

| #   | Concern                  | Question it answers                                      | Owner                    |
| --- | ------------------------ | -------------------------------------------------------- | ------------------------ |
| 1   | **Identity**             | Who is the user?                                         | Supabase Auth            |
| 2   | **IAM**                  | What is this actor allowed to do?                        | IAM service              |
| 3   | **Tenant**               | Which business/customer owns the resources?              | Tenant service           |
| 4   | **Application Registry** | Which applications exist and where do they live?         | Registry                 |
| 5   | **Monetization**         | What has the tenant purchased / what capabilities exist? | Monetization service     |
| 6   | **Domain / Routing**     | Which hostname maps to which tenant + application?       | Tenant service (domains) |
| 7   | **Application logic**    | What does the actual product do?                         | Each application         |

---

## 3. The central abstraction

```text
ONE IDENTITY
     |
MANY ORGANIZATIONS      (Supabase Auth organizations)
     |
MANY TENANTS            (Figentra business/resource boundaries)
     |
MANY APPLICATIONS       (CRM, Commerce, POS, …)
     |
APPLICATION-SPECIFIC ROLES
     |
APPLICATION-SPECIFIC PERMISSIONS       (IAM: "can the actor do it?")
     |
TENANT-SPECIFIC ENTITLEMENTS           (Monetization: "did the tenant buy it?")
     |
INDEPENDENT APPLICATION DATA           (tenant-isolated)
```

Effective access is the **intersection** of five inputs:

```text
Actor  +  Active Organization/Tenant  +  Application  +  Role/Permissions  +  Subscription/Entitlements
```

A request is allowed only when **all** of these agree. IAM and entitlement
checks are independent and both may be required.

---

## 4. What Figentra IS

- A **control plane** for identity, tenancy, IAM, monetization, application
  registry, integrations, and versioning.
- A **shared platform substrate**: one login, one billing relationship, one
  authorization model across every hosted application.
- A **contract-first** system: services talk over versioned APIs and events,
  never over each other's databases.
- **Cloudflare-native** at the edge and for most compute, with an AWS escape
  hatch for workloads that genuinely need it.
- An **orchestrator of infrastructure** via Terraform — it declares desired
  infrastructure state; it does not become the infrastructure scheduler.

## 5. What Figentra is NOT

- **Not a deployment PaaS.** It is not Heroku / Vercel / Render. It does not own
  a Build service, an Artifact service, a Deployment scheduler, or preview-env
  orchestration. New product deployments are managed through **Terraform**
  (optionally fronted by an Infrastructure Orchestrator API — see
  [15](15-infrastructure-and-iac.md)). This is the R-2 scope correction.
- **Not a replacement for Supabase Auth.** It never re-implements
  authentication, sessions, passwords, MFA, or org membership.
- **Not a monolith and not a microservice explosion.** It starts with four
  platform domains (IAM, Tenant, Monetization, Registry) and extracts more only
  for a measurable reason.
- **Not a builder of infrastructure primitives.** It does not build a custom
  container scheduler, identity system, ORM, message broker, object store, CDN,
  DNS, or payment processor. It composes existing primitives (Cloudflare,
  Supabase, Supabase Auth, Stripe/Paddle).

---

## 6. Design principles

1. **Separation of identity, authorization, and entitlement.** Three questions,
   three owners, three checks. Never merge them.
2. **The application is never the tenant.** Tenancy is a platform concept.
3. **Never trust client-supplied identity context.** `tenantId`, `userId`,
   `role`, `organizationId` must be derived server-side from a validated
   Supabase Auth token + trusted mappings — never read from a request body or
   query string.
4. **Own your data; talk over contracts.** No service reads or writes another
   service's database. Cross-context communication is API (sync) or event
   (async) only.
5. **Small runtime for the job.** Workers + Hono for edge/lightweight;
   Containers + NestJS for substantial services. Do not force NestJS into a
   Worker or rewrite a NestJS service into Hono for consistency.
6. **Contract-first.** OpenAPI + JSON Schema + TypeScript types in
   `@figentra/contracts`. Share contracts, never persistence models.
7. **Events announce facts; workflows orchestrate work; commands request
   change.** These are distinct (see [11](11-events-and-workflows.md)).
8. **Not every action is an event.** Meaningful business state transitions
   become domain events. Reads never do.
9. **Idempotency everywhere it matters.** Billing, provisioning, webhooks, and
   event consumers tolerate retries by construction.
10. **Extract later, not now.** A bounded context starts as a module. Promote to
    a separate deployment only for independent scaling, ownership, security
    boundary, or volume.
11. **Small tokens.** Supabase Auth JWT claims stay minimal; dynamic platform
    state is fetched from services, not baked into the token.
12. **Defense in depth for tenant isolation.** Server-side authorization +
    Supabase RLS + tenant-scoped queries — never frontend filtering alone.

---

## 7. The four actor types

Every authenticated caller is one of four actor types, all flowing through the
same IAM authorization model (detail in [02](02-identity-and-actors.md)):

| Actor                 | Example                                                  | Credential                       |
| --------------------- | -------------------------------------------------------- | -------------------------------- |
| **User**              | A human using the portal or an app                       | Supabase Auth session / JWT      |
| **Service Account**   | A tenant's automation calling the platform API           | PAT / OAuth client credentials   |
| **System**            | A platform service acting on its own behalf              | Service identity token / binding |
| **Integration Actor** | An installed third-party integration acting for a tenant | Scoped integration credentials   |

---

## 8. Reading order

New engineers/agents read: this doc →
[01 architecture](01-platform-architecture.md) →
[02 identity](02-identity-and-actors.md) →
[03 tenancy](03-tenancy-and-domains.md) → [04 IAM](04-iam-and-authorization.md)
→ [05 monetization](05-monetization-and-billing.md). Then branch by task. The
[golden rules](21-glossary-and-golden-rules.md) are the one-page contract every
change must respect.

---

## 9. Open questions

- **O-1** — Design-system/query package naming (`@stackra/*` vs `@figentra/*`).
- **O-7** — Which application is built end-to-end first (validates the whole
  model).
