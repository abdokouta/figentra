# 01 — Platform Architecture

**Status:** Baseline **Owner:** Platform architecture **Related:**
[00 Overview](00-overview-and-principles.md),
[08 API Gateway](08-api-gateway.md),
[15 Infrastructure & IaC](15-infrastructure-and-iac.md)

---

## 1. Planes

Figentra is organized into **planes**, not just services. A plane is a
horizontal concern that groups services with a shared responsibility and
lifecycle.

```text
                                 FIGENTRA
                                     │
   ┌─────────────┬───────────────────┼───────────────────┬──────────────┐
   │             │                   │                   │              │
   ▼             ▼                   ▼                   ▼              ▼
IDENTITY     CONTROL PLANE      APPLICATION PLANE   PLATFORM SERVICES  OPERATIONS
 PLANE           │                   │                   │              │
   │        Tenant                Commerce            Notifications    Logs
 Supabase Auth      IAM                   CRM                 Search           Metrics
            Monetization          POS                 Reporting        Traces
            App Registry          Analytics           Usage/Metering   Audit
            Integrations          (future apps)       Workflows        Health
            Versioning                                Files (R2)       Status
            Feature Flags                             Webhooks         Backup/DR
                                                      Scheduler        FinOps
                                                      AI Gateway*
                                                      Approval*
                             │
                             ▼
                       PLATFORM PLANE (substrate)
              Cloudflare · Supabase Postgres · R2 · Queues · D1 · KV · DO
                             │
                       INFRASTRUCTURE PLANE
                       Terraform (desired state)
```

`*` AI Gateway and Approval are **P2 / deferred** (see
[20](20-implementation-roadmap.md)).

### Plane definitions

| Plane                    | Owns                                                                                                                | Lifecycle                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Identity**             | Authentication, sessions, MFA, org membership (Supabase Auth).                                                      | Managed (external).                 |
| **Control**              | Tenancy, IAM, monetization, registry, integrations, versioning, feature flags.                                      | Platform-owned, high stability.     |
| **Application**          | Business domains (CRM, Commerce, POS, …). Independent per app.                                                      | Product-owned, ships independently. |
| **Platform services**    | Shared cross-cutting capabilities (notifications, search, reporting, usage, workflows, files, webhooks, scheduler). | Platform-owned, added as needed.    |
| **Operations**           | Logs, metrics, traces, audit, health, status, backup/DR, FinOps.                                                    | Platform-owned.                     |
| **Platform (substrate)** | Cloudflare + Supabase + R2 + Queues + D1 + KV + Durable Objects.                                                    | Vendor-managed.                     |
| **Infrastructure**       | Terraform desired-state for everything above the substrate.                                                         | GitOps / IaC.                       |

The R-2 scope decision means there is **no Developer/PaaS plane** (no Projects/
Environments/Builds/Deployments as platform services). Deployment is Terraform +
Wrangler; see [15](15-infrastructure-and-iac.md).

---

## 2. High-level request topology

```text
                              USER / CLIENT
                                    │
                                    ▼
                             Cloudflare Edge
                          (DNS · WAF · CDN · TLS)
                                    │
                                    ▼
                            api.figentra.com
                        API Gateway (Worker + Hono)
             authn prevalidation · routing · rate limit · request-id
                                    │
         ┌──────────────────┬───────┴────────┬───────────────────┐
         │                  │                │                   │
         ▼                  ▼                ▼                   ▼
   Application         IAM Service      Tenant Service     Monetization
   Registry            (Container/      (Container/        (Container/
   (Worker + D1)        NestJS)          NestJS)            NestJS)
         │                  │                │                   │
         │                  └────────┬───────┴───────────────────┘
         │                           │
         │                           ▼
         │                    Supabase PostgreSQL
         │                  (per-service DB/schema)
         │
         ▼
   Applications (CRM / Commerce / POS / …)
   Worker or Container + own Supabase DB
                                    │
                                    ▼
                            Queues / Events
                                    │
                   ┌────────────────┼────────────────┐
                   ▼                ▼                 ▼
                 Audit           Usage           Notifications
```

Key rules embedded in this topology:

- Every external request enters through the **edge** and the **API Gateway**;
  internal services are not public unless there is a real external use case.
- The gateway carries **no business logic** — routing, edge auth, rate limiting,
  correlation IDs, versioning, security headers only.
- Services reach **their own** database only. Cross-service reads go through
  APIs or event-fed projections.

---

## 3. DNS / subdomain strategy

Public surface (only what has a real external use case is exposed):

```text
figentra.com
├── www.figentra.com          Marketing / public site
├── identity.figentra.com     Supabase Auth authentication experience
├── app.figentra.com          Central portal
├── api.figentra.com          API Gateway / public platform API
├── iam.figentra.com          IAM API (expose only if externally needed)
├── tenant.figentra.com       Tenant API
├── billing.figentra.com      Monetization / billing API
├── registry.figentra.com     Application Registry API
├── docs.figentra.com         Documentation / developer portal
├── status.figentra.com       Platform status page
├── crm.figentra.com          CRM application
├── commerce.figentra.com     Commerce application
├── pos.figentra.com          POS application
└── analytics.figentra.com    Analytics application
```

Preferred internal pattern — internal services sit behind the gateway rather
than each getting a public subdomain:

```text
Internet → api.figentra.com → API Gateway → { internal IAM, Tenant, Monetization, Registry }
```

Custom tenant domains (`crm.acme.com`, `acme.figentra.com`) resolve to a
tenant + application via the domain-resolution mechanism in
[03](03-tenancy-and-domains.md).

---

## 4. Service inventory (baseline)

| Service                          | Subdomain                            | Runtime                     | Framework             | Store                    | Status        |
| -------------------------------- | ------------------------------------ | --------------------------- | --------------------- | ------------------------ | ------------- |
| Identity                         | `identity.figentra.com`              | Managed                     | Supabase Auth         | Supabase Auth            | External      |
| API Gateway                      | `api.figentra.com`                   | Cloudflare Worker           | Hono                  | — (KV/D1 as needed)      | Build (P0)    |
| Application Registry             | `registry.figentra.com`              | Cloudflare Worker           | Hono                  | D1 (+ KV)                | Build (P0)    |
| IAM                              | `iam.figentra.com`                   | Cloudflare Container        | NestJS / Node 22      | Supabase PostgreSQL      | Build (P0)    |
| Tenant (+ Domains)               | `tenant.figentra.com`                | Cloudflare Container        | NestJS / Node 22      | Supabase PostgreSQL      | Build (P0)    |
| Monetization                     | `billing.figentra.com`               | Cloudflare Container        | NestJS / Node 22      | Supabase PostgreSQL      | Build (P0)    |
| Portal                           | `app.figentra.com`                   | Cloudflare (Workers/Assets) | React + Vite + RR7    | API-driven               | Build (P0)    |
| Integration Platform             | internal (+ marketplace UI)          | Container / Worker          | NestJS / Hono         | Supabase PostgreSQL      | Build (P1)    |
| Audit                            | internal                             | Container / Worker          | NestJS / Hono         | PostgreSQL / event store | Later (P1)    |
| Usage / Metering                 | internal (in Monetization initially) | Container                   | NestJS                | PostgreSQL / Queue       | Extract later |
| Notifications                    | internal                             | Container / Worker          | NestJS / Hono         | Provider / DB / Queue    | Later (P1)    |
| Workflows                        | internal                             | CF Workflows + Worker       | `@figentra/workflows` | Workflow state           | Later (P1)    |
| CRM / Commerce / POS / Analytics | `*.figentra.com`                     | Container / Worker          | App-specific          | Supabase (per app)       | Product       |

---

## 5. Communication model summary

Detail lives in [09](09-service-communication.md); the shape:

- **Synchronous (HTTP/REST):** authorization checks, tenant lookup, application
  metadata, subscription/entitlement lookup, admin operations. Anything needing
  an immediate answer.
- **Asynchronous (events/Queues):** tenant lifecycle, subscription changes,
  entitlement changes, usage, audit, notifications, provisioning, long-running
  work.
- **Cloudflare-native where practical:** Worker→Worker via service bindings;
  Worker→Container via the Worker-in-front pattern.
- **Never** the user's Supabase Auth token as a machine-to-machine credential —
  service identity is a first-class concern.

---

## 6. Non-goals / anti-patterns

| Anti-pattern                                            | Correct                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Public subdomain for every internal service             | Behind the gateway unless externally needed.               |
| Business logic in the API Gateway                       | Gateway = edge concerns only.                              |
| A service reading another service's DB                  | API call or event-fed projection.                          |
| One giant database for all applications                 | Per-service and per-application databases.                 |
| A Developer/PaaS plane (Build/Deploy/Artifact services) | Terraform + Wrangler (R-2).                                |
| Splitting every domain concept into a deployment        | Start with 4 platform domains; extract on measurable need. |

---

## 7. Open questions

- **O-5** — Is the Infrastructure Orchestrator API in v1 scope, or is
  Terraform-by-hand acceptable at launch? Affects whether an
  `infrastructure.figentra.com` surface exists early.
