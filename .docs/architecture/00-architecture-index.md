# Architecture Index

## 1. System layers

```text
                    FIGENTRA PLATFORM
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
   SECURITY             PLATFORM          COMMERCIAL
       │                   │                   │
 Identity                Registry          Monetization
 Principal               Domain            Entitlements
 Credentials             Integrations      Metering
 IAM                     Notifications
 Tenant                  Workflow
 Scope                   Events
 Policy                  Search
 Approval                Reporting
 Audit
       │
       └───────────────────┬───────────────────┘
                           │
                     APPLICATIONS
                           │
                 application business logic
```

## 2. Security kernel

The security kernel is:

```text
Identity
  ↓
Principal
  ↓
Credential
  ↓
Tenant Context
  ↓
Scope Context
  ↓
IAM
  ↓
Policy
  ↓
Approval
  ↓
Audit
```

## 3. Service inventory

| Service | Boundary | State |
|---|---|---|
| Identity Platform | authentication integration, identity, principals, service accounts, credentials | foundation approved |
| IAM | permissions, roles, assignments, grants, policies, authorization | foundation approved |
| Tenant | tenant lifecycle and customer boundary | design pending |
| Scope | dynamic application-defined hierarchy/context | design pending |
| Policy | policy lifecycle/evaluation | design pending; may be inside IAM initially |
| Approval | approval lifecycle | design pending |
| Audit | security/business audit | design pending |
| Application Registry | applications, modules, resources, actions, manifests | Cloudflare Worker + Hono |
| Domain | custom domains/DNS/certificates/routing metadata | pending |
| Monetization | plans, prices, subscriptions, invoices, provider adapters | pending |
| Entitlements | commercial capability grants | pending |
| Usage | metering, counters, usage aggregation | pending |
| Integrations | app installations/connections/credentials | pending |
| Notifications | email/web/in-app/push/SMS | pending |
| Workflow | durable orchestration | pending |
| Events | event contracts/outbox/delivery | foundation |
| Search | derived indexes/search API | pending |
| Reporting | facts/dimensions/reports | pending |
| Files | object metadata and access | pending |
| API Gateway | edge routing/security/rate limits | Cloudflare Worker + Hono |
| Deployment | controlled deployment/Terraform automation | pending |

## 4. Microservice rule

A service in this table is a **bounded responsibility**, not an automatic deployment.

Start as a modular monolith or small number of deployables where appropriate.

Split into independently deployed services only when one or more of these are true:

- independent scaling
- independent security boundary
- independent deployment cadence
- different runtime requirements
- different availability/SLA
- clear data ownership
- operational isolation is valuable

## 5. Application boundary

Applications own:

- domain entities
- business rules
- business workflows
- application UI
- application-specific reports
- application-specific resources

Figentra owns reusable platform capabilities.

## 6. Source of truth

Every piece of data has one authoritative owner.

Other services use:

- APIs
- events
- references
- projections

They do not directly mutate another service's database.

## Workers package

```text
workers/
├── gateway
├── registry
└── webhooks
```

There is no standalone `public-api` Worker in the initial architecture. Public API exposure is a routing/API-surface concern and can be served by the gateway, registry, or the owning NestJS service.

## Deployment/runtime map

```text
services/gateway       → Cloudflare Worker + Hono
workers/registry      → Cloudflare Worker + Hono
infrastructure → infrastructure composition and deployment tooling
services/*            → NestJS by default
apps/portal           → Vite + React + HeroUI
apps/landing-page     → Vite + React + HeroUI
```
