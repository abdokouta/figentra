# Figentra Platform Architecture & AI Implementation Specification

**Document Type:** Master architecture specification / AI coding-agent prompt  
**Status:** Proposed baseline architecture  
**Version:** 1.1  
**Date:** 2026-08-30  
**Primary Stack:** TypeScript / Node.js / NestJS + Cloudflare Workers + Cloudflare Containers + Hono + React Router v7/Vite + Clerk + Supabase PostgreSQL + Terraform  
**Platform Model:** Multi-tenant, multi-application SaaS platform

---

## 0. Purpose

This document is the **source of truth for AI coding agents and engineers implementing the Figentra platform**.

Figentra is not a single SaaS application. It is a **platform hosting multiple independent applications** that share:

- one user identity
- authentication
- organization membership
- tenant context
- access control
- application registry
- subscriptions
- plans
- entitlements
- billing
- usage/metering
- domains and tenant routing

Each Figentra application has its own business logic, APIs, database/data model, deployment lifecycle, and UI.

The platform must therefore separate:

1. **Identity** — Who is the user?
2. **IAM** — What is the user allowed to access?
3. **Tenant** — Which business/customer owns the resources?
4. **Application Registry** — Which applications exist and where are they deployed?
5. **Monetization** — What has the tenant purchased and what capabilities are available?
6. **Domain/Routing** — Which domain maps to which tenant/application?
7. **Application Business Logic** — What does each actual product do?

---

# 1. Core Architectural Principle

The fundamental model is:

```text
User
  |
  | belongs to
  v
Clerk Organization
  |
  | maps to
  v
Figentra Tenant
  |
  +---- Applications
  |
  +---- Subscription
  |
  +---- Entitlements
  |
  +---- Domains
  |
  +---- Resources
```

A user's effective application access is:

```text
User
  +
Tenant / Organization
  +
Application
  +
Role / Permissions
  +
Subscription / Entitlements
```

Never treat the application itself as the tenant.

Never treat Clerk as the complete Figentra business domain.

Never duplicate Clerk's authentication functionality inside Figentra.

---

# 2. High-Level Architecture

```text
                         FIGENTRA PLATFORM
                                |
                +---------------+----------------+
                |                                |
                v                                v
       identity.figentra.com             app.figentra.com
                |                                |
              Clerk                         Figentra Portal
                |                                |
                | JWT/session                    |
                +---------------+----------------+
                                |
                                v
                       api.figentra.com
                         API Gateway
                                |
              +-----------------+------------------+
              |                 |                  |
              v                 v                  v
         IAM Service       Tenant Service     Monetization
              |                 |                  |
              |                 |                  |
              +-----------------+------------------+
                                |
                                v
                       Application Registry
                     Cloudflare Worker + D1
                                |
               +----------------+----------------+
               |                |                |
               v                v                v
             CRM            Commerce             POS
               |                |                |
               v                v                v
          Application       Application       Application
             DB                DB                DB
          Supabase          Supabase          Supabase
```

---

# 3. Public DNS / Subdomain Strategy

Recommended public surface:

```text
figentra.com
|
+-- www.figentra.com
|      Marketing / public website
|
+-- identity.figentra.com
|      Clerk authentication experience
|
+-- app.figentra.com
|      Central Figentra application portal
|
+-- api.figentra.com
|      API Gateway / public platform API
|
+-- iam.figentra.com
|      IAM API
|
+-- tenant.figentra.com
|      Tenant API / tenant management
|
+-- billing.figentra.com
|      Monetization / billing API
|
+-- registry.figentra.com
|      Application Registry API
|
+-- docs.figentra.com
|      Documentation
|
+-- status.figentra.com
|      Platform status
|
+-- crm.figentra.com
|      CRM application
|
+-- commerce.figentra.com
|      Commerce application
|
+-- pos.figentra.com
|      POS application
|
+-- analytics.figentra.com
|      Analytics application
```

### Important

Not every internal service needs a public subdomain.

The preferred pattern is:

```text
Internet
   |
   v
api.figentra.com
   |
   v
API Gateway
   |
   +---- internal IAM
   +---- internal Tenant
   +---- internal Monetization
   +---- internal Application Registry
```

Public endpoints should be exposed only when there is a real external use case.

---

# 4. Service Inventory

## 4.1 Identity

**Public domain:**

```text
identity.figentra.com
```

**Technology:**

```text
Clerk
```

### Responsibilities

Clerk is authoritative for:

- User identity
- Authentication
- Sessions
- Passwords
- Social login
- MFA
- SSO
- Invitations
- Organization membership
- Basic organization roles

### Do NOT build

Do not build:

- custom password storage
- custom session management
- custom MFA
- custom OAuth provider
- duplicate user authentication
- duplicate organization membership engine

unless a specific future requirement requires it.

---

# 5. Clerk Organization vs Figentra Tenant

These are related but intentionally different concepts.

## Clerk Organization

Represents the identity/access organization:

```text
org_123
```

Clerk owns:

- organization membership
- user-to-organization relationship
- organization roles
- authentication context

## Figentra Tenant

Represents the business/resource ownership boundary:

```text
ten_123
```

Example:

```json
{
  "id": "ten_123",
  "clerkOrganizationId": "org_123",
  "name": "Acme Corporation",
  "status": "active",
  "region": "me-central"
}
```

The relationship is:

```text
Clerk Organization
        |
        | 1:1 initially
        v
Figentra Tenant
```

Do not assume the implementation can never evolve beyond 1:1.

The Tenant domain may eventually contain:

- tenant configuration
- region
- data residency
- timezone
- currency
- status
- domains
- application configuration
- resources
- billing account reference
- subscription reference

---

# 6. IAM Service

**Logical service:**

```text
iam-service
```

**Preferred public/API domain:**

```text
iam.figentra.com
```

**Technology:**

```text
Node.js
TypeScript
NestJS
PostgreSQL / Supabase
```

## IAM answers:

> Who is allowed to do what?

It does NOT answer:

> Does the tenant's subscription include this capability?

That belongs to Monetization/Entitlements.

## IAM responsibilities

- Application access
- Platform roles
- Application roles
- Permissions
- Access policies
- Authorization decisions
- Role assignment
- Permission evaluation
- Tenant/application/user access context

Example:

```text
User: user_123
Tenant: ten_123
Application: crm

Role:
  crm:admin

Permissions:
  crm.customer.read
  crm.customer.create
  crm.customer.update
  crm.customer.delete
```

---

# 7. IAM Data Model

Suggested logical model:

```text
roles
permissions
role_permissions
user_roles
organization_roles
application_roles
application_permissions
access_policies
```

Example:

```text
roles
-----
id
key
name
scope
application_id
system
created_at
updated_at
```

```text
permissions
-----------
id
key
name
description
application_id
created_at
updated_at
```

```text
role_permissions
----------------
role_id
permission_id
```

The exact physical schema may evolve.

Do not create unnecessary tables if the use case can be represented more simply.

---

# 8. Tenant Service

**Logical service:**

```text
tenant-service
```

**Domain:**

```text
tenant.figentra.com
```

**Technology:**

```text
Node.js
TypeScript
NestJS
PostgreSQL / Supabase
```

## Tenant service responsibilities

- Figentra tenant lifecycle
- Clerk Organization → Tenant mapping
- Tenant configuration
- Tenant status
- Tenant region
- Data residency configuration
- Tenant metadata
- Domain ownership/mapping
- Domain verification
- Application domain mapping
- Tenant routing metadata

---

# 9. Tenant + Domain Decision

Tenant and Domain are intentionally combined initially.

Reason:

```text
Domain
   |
   v
Tenant
   |
   v
Application
```

Typical examples:

```text
acme.figentra.com
        |
        v
Acme Tenant
```

or:

```text
crm.acme.com
     |
     v
Acme Tenant
     |
     v
CRM Application
```

This makes domain resolution part of the tenant boundary.

### Domain model

```text
domains
-------
id
tenant_id
hostname
type
verification_status
is_primary
application_id
created_at
updated_at
```

Possible domain types:

```text
platform
tenant
application
custom
```

Do not create a separate Domain microservice initially.

Extract it later only if DNS/certificate/routing infrastructure becomes sufficiently complex.

---

# 10. Domain Resolution

The platform should be able to resolve:

```text
hostname
   |
   v
tenant
   |
   v
application
```

Example:

```text
crm.acme.com
    |
    +-- tenant = ten_acme
    |
    +-- application = crm
```

The application must not trust a tenant ID supplied by the browser.

The server must resolve/validate the tenant based on:

- authenticated identity
- active Clerk organization
- trusted domain mapping
- application access

---

# 11. Application Registry

The Application Registry is intentionally lightweight.

It is NOT a traditional large Node.js microservice.

Recommended architecture:

```text
registry.figentra.com
        |
        v
Cloudflare Worker
        |
        +---- D1
        |
        +---- KV where appropriate
```

## Responsibilities

The registry describes applications and their deployment/configuration metadata.

It can store:

- application key
- name
- slug
- URL
- environments
- versions
- capabilities
- status
- deployment metadata
- application domains
- supported plans
- required entitlements
- icon/branding metadata

Example:

```json
{
  "key": "crm",
  "name": "Figentra CRM",
  "productionUrl": "https://crm.figentra.com",
  "status": "active",
  "version": "2.4.0",
  "capabilities": [
    "customers",
    "leads",
    "analytics",
    "ai"
  ]
}
```

## Why Worker + D1?

Application Registry is primarily:

- configuration
- metadata
- lookup
- routing
- CRUD
- high-read / low-compute workloads

A full NestJS service would add unnecessary operational overhead.

Use:

```text
Cloudflare Worker
Hono
TypeScript
D1
KV where useful
```

Use Durable Objects only if a specific feature requires strongly consistent state/coordination.

---

# 12. What an Application Means

An application is an independent Figentra product.

Examples:

```text
CRM
Commerce
POS
Analytics
Inventory
HR
Projects
```

Each application owns:

- business logic
- application API
- application database
- application frontend
- application-specific permissions
- application-specific workflows
- application deployment lifecycle

Applications should not own:

- authentication
- global tenant identity
- global billing
- global subscription
- global platform entitlement definitions

Those belong to the platform.

---

# 13. Monetization Service

Do NOT initially call this merely:

```text
subscription-service
```

Subscription is only one part of the domain.

Do NOT use `commerce` if "commerce" may later refer to the actual Commerce product/application.

Recommended logical name:

```text
monetization-service
```

Public/API domain:

```text
billing.figentra.com
```

## Monetization owns

```text
Products
Plans
Subscriptions
Billing
Invoices
Entitlements
Metering
Usage
Credits
Pricing
```

Initial physical implementation can be ONE service.

Logical modules:

```text
monetization-service
|
+-- catalog
|   +-- products
|   +-- plans
|
+-- subscriptions
|
+-- billing
|
+-- invoices
|
+-- entitlements
|
+-- metering
|
+-- usage
|
+-- credits
```

---

# 14. Why Monetization Combines These Domains Initially

The following concepts are strongly related:

```text
Product
   |
   v
Plan
   |
   v
Subscription
   |
   v
Entitlements
   |
   v
Usage / Metering
   |
   v
Billing
```

Therefore they can start in one bounded service.

Later, if scale requires it:

```text
monetization-service
        |
        +-- billing-service
        +-- entitlement-service
        +-- usage-service
```

can be extracted.

Do not split these into separate network services merely because they are separate modules.

---

# 15. Entitlement vs Permission

This distinction is mandatory.

## IAM Permission

Answers:

> Is this user allowed to perform this action?

Example:

```text
crm.customer.delete
```

## Entitlement

Answers:

> Has this tenant purchased/enabled this capability?

Example:

```text
crm.ai = true
```

Therefore:

```text
Request
   |
   v
IAM
"Can the user do this?"
   |
   v
Entitlement
"Does the tenant have this capability?"
   |
   v
Application
"Is the operation valid?"
```

Both checks may be required.

---

# 16. Example Entitlements

```text
crm.ai = true
crm.max_users = 500

commerce.max_products = 100000
commerce.advanced_reports = true

pos.terminals = 50

analytics.advanced = true

api.requests_per_minute = 10000
```

Entitlements may be:

- boolean
- integer
- decimal
- string
- structured configuration

Avoid hard-coding subscription plans inside applications.

Applications should ask for capabilities/entitlements.

---

# 17. Metering and Usage

Initially:

```text
monetization-service
```

owns metering and usage.

Applications emit usage events.

Example:

```json
{
  "tenantId": "ten_123",
  "application": "crm",
  "metric": "ai_requests",
  "quantity": 1,
  "timestamp": "2026-08-30T00:00:00Z"
}
```

Possible metrics:

```text
ai_requests
api_requests
storage_bytes
documents_processed
orders
active_users
tokens
messages
```

At high scale, usage ingestion should eventually be extracted into:

```text
usage-service
```

possibly using an event/queue architecture.

---

# 18. Billing Model

Billing is tenant-centric.

Prefer:

```text
Tenant
  |
  v
Billing Account
  |
  v
Subscription
  |
  v
Plan
```

Not:

```text
User
  |
  v
Subscription
```

unless the product explicitly supports individual consumers.

Suggested model:

```text
billing_accounts
----------------
id
tenant_id
provider
external_customer_id
currency
status
created_at
updated_at
```

```text
subscriptions
-------------
id
tenant_id
billing_account_id
plan_id
status
start_at
current_period_start
current_period_end
cancel_at
created_at
updated_at
```

Payment provider integration must remain behind an abstraction.

Do not spread Stripe/provider-specific logic throughout the applications.

---

# 19. Portal

**Domain:**

```text
app.figentra.com
```

The portal is the central user workspace.

Responsibilities:

- show authenticated user
- show active organization
- organization switching
- application launcher
- tenant administration
- account/security links
- subscription/billing links
- platform settings
- available applications

Example:

```text
Acme Corporation

Applications
-------------------------
CRM          Open
Commerce     Open
POS          Open
Analytics    No access

Administration
-------------------------
Organization
Members
Applications
Billing
Security
Domains
```

The portal should retrieve application access from IAM/registry/monetization rather than hard-coding applications.

---

# 20. Authentication Flow

User visits:

```text
crm.figentra.com
```

If unauthenticated:

```text
crm.figentra.com
       |
       v
identity.figentra.com/sign-in
       |
       v
Clerk authentication
       |
       v
Authenticated session
       |
       v
Determine active organization
       |
       v
Check Figentra tenant
       |
       v
Check CRM access
       |
       v
crm.figentra.com/dashboard
```

If the user originally requested:

```text
crm.figentra.com/customers/123
```

preserve the destination and return there after authentication.

---

# 21. Multi-Organization User

A user may belong to multiple Clerk Organizations.

Example:

```text
Abdelrahman
|
+-- Acme
|    +-- CRM = admin
|    +-- POS = manager
|
+-- Other Company
     +-- CRM = viewer
     +-- Analytics = admin
```

The authorization model is:

```text
User
+
Active Organization
+
Application
+
Role
+
Permissions
```

Never authorize based only on the user ID.

---

# 22. API Request Context

Every authenticated request should conceptually have:

```typescript
interface RequestIdentityContext {
  userId: string;
  clerkOrganizationId?: string;
  tenantId?: string;
  applicationKey?: string;
  role?: string;
  permissions?: string[];
}
```

Do not trust these values when supplied directly by the browser.

They must be derived from:

1. validated Clerk token/session
2. tenant mapping
3. domain/application context
4. IAM authorization

---

# 23. Token Strategy

Keep Clerk session tokens small.

Do not put the entire Figentra platform state into Clerk custom claims.

Good:

```json
{
  "sub": "user_123",
  "org_id": "org_456",
  "org_role": "admin"
}
```

Avoid putting:

```text
subscriptions
100+ permissions
all applications
all entitlements
tenant configuration
billing information
```

into the JWT.

Reasons:

- token size
- stale claims
- revocation complexity
- browser cookie/header limits
- coupling

Use services/databases for dynamic platform data.

---

# 24. Application Authorization Flow

For a request:

```text
POST /orders
```

the flow should be:

```text
Request
  |
  v
API Gateway
  |
  v
Validate Clerk identity
  |
  v
Resolve Tenant
  |
  v
Resolve Application
  |
  v
IAM
  |
  +-- user has orders.create?
  |
  v
Entitlement
  |
  +-- tenant has commerce.orders?
  |
  v
Commerce Service
  |
  v
Database
```

The application remains responsible for final business validation.

---

# 25. Database Strategy

Do not use one giant database for every application by default.

Recommended:

```text
Platform
|
+-- IAM DB
|
+-- Tenant DB
|
+-- Monetization DB
|
+-- Registry D1
|
+-- Application DBs
     |
     +-- CRM
     +-- Commerce
     +-- POS
     +-- Analytics
```

Supabase PostgreSQL is appropriate for the relational platform services and application databases.

D1 is appropriate for lightweight application registry/configuration workloads.

---

# 26. Tenant Isolation

Every application that stores tenant-owned data should have a tenant boundary.

Typical table:

```sql
organization_id
-- or
tenant_id
```

Prefer `tenant_id` for Figentra business/resource ownership.

Where Clerk organization identity is required, store:

```text
clerk_org_id
```

as a trusted mapping.

Example:

```text
tenant
-----
id = ten_123
clerk_org_id = org_456
```

---

# 27. Supabase RLS

Supabase Row Level Security should provide defense-in-depth.

Conceptually:

```sql
organization_id =
  authenticated_clerk_organization_id
```

The exact JWT claim structure must match the current Clerk/Supabase integration configuration.

Never rely only on frontend filtering.

Never trust:

```http
?tenantId=ten_other
```

from the client.

---

# 28. Clerk → Supabase Integration

Use the current Clerk third-party authentication integration supported by Supabase.

Do not implement the old/deprecated JWT-template integration for new work.

Architecture:

```text
Clerk
  |
  v
JWT
  |
  v
Supabase
  |
  v
RLS
```

Applications can therefore use Clerk as identity while Supabase remains the data layer.

---

# 29. Service Communication

Preferred communication model:

### Synchronous

Use HTTP/REST for:

- authorization checks
- tenant lookup
- application metadata
- subscription lookup
- administrative operations

### Asynchronous

Use events for:

- usage
- audit
- notifications
- subscription lifecycle events
- application provisioning
- long-running operations

Example events:

```text
tenant.created
tenant.updated
tenant.suspended

application.enabled
application.disabled

subscription.created
subscription.updated
subscription.cancelled

entitlement.changed

usage.recorded

domain.verified

user.invited
```

Do not introduce Kafka just because the platform is "microservices".

Start with a simpler queue/event mechanism and move to Kafka/MSK when actual volume and operational requirements justify it.

---

# 30. API Gateway

Recommended:

```text
api.figentra.com
```

Initially:

```text
Cloudflare Worker
```

Responsibilities:

- routing
- authentication/token validation
- rate limiting
- request correlation ID
- basic security policy
- API versioning
- routing to internal services

Do not put business logic in the gateway.

---

# 31. Technology Standard

## Primary Backend

```text
Node.js
TypeScript
NestJS
```

Use NestJS for substantial platform services:

```text
IAM
Tenant
Monetization
```

Benefits:

- rapid development
- TypeScript consistency
- dependency injection
- modules
- guards
- validation
- testing
- OpenAPI
- strong AI coding-agent support

---

# 32. Lightweight Services

Use:

```text
Cloudflare Workers
Hono
TypeScript
```

for:

- Application Registry
- API Gateway
- lightweight routing
- webhooks where appropriate
- simple edge services

Do not use NestJS for every tiny endpoint.

---

# 33. Go

Go is NOT the default language for the platform.

Use Go later where justified by:

- very high throughput
- CPU-intensive workloads
- large usage ingestion
- high-volume event processing
- specialized infrastructure services
- performance-critical services

Do not introduce Go merely because it is faster in benchmarks.

Development speed and consistency are more important for the initial Figentra platform.

---

# 34. Laravel

Laravel is not the recommended primary backend for the new Figentra platform.

It remains appropriate if:

- a legacy PHP service already exists
- Magento/PHP integration makes it materially advantageous
- a specific team/service is already optimized for Laravel

Otherwise use TypeScript/Node.js.

---

# 35. Recommended Stack

```text
Frontend
--------------------
Next.js
React
TypeScript


Platform APIs
--------------------
Node.js
TypeScript
NestJS


Edge / Lightweight
--------------------
Cloudflare Workers
Hono
TypeScript


Identity
--------------------
Clerk


Primary Database
--------------------
PostgreSQL
Supabase


Registry Database
--------------------
Cloudflare D1


Cache
--------------------
Redis / Upstash


Object Storage
--------------------
Cloudflare R2 or S3


Events / Queues
--------------------
Cloudflare Queues initially
Kafka/MSK only when justified


Infrastructure
--------------------
Terraform or Pulumi


Observability
--------------------
OpenTelemetry
Sentry
Cloudflare observability
```

---

# 36. Recommended Initial Repository Structure

A monorepo is strongly recommended.

Example:

```text
figentra/
|
+-- apps/
|   |
|   +-- portal/
|   +-- iam-api/
|   +-- tenant-api/
|   +-- monetization-api/
|
+-- workers/
|   |
|   +-- api-gateway/
|   +-- application-registry/
|
+-- packages/
|   |
|   +-- auth/
|   +-- iam/
|   +-- tenant/
|   +-- monetization/
|   +-- contracts/
|   +-- events/
|   +-- sdk/
|   +-- config/
|   +-- observability/
|
+-- applications/
|   |
|   +-- crm/
|   +-- commerce/
|   +-- pos/
|   +-- analytics/
|
+-- infrastructure/
|   |
|   +-- terraform/
|   +-- cloudflare/
|   +-- supabase/
|
+-- docs/
|
+-- package.json
+-- package.json workspaces
+-- turbo.json
```

The exact monorepo tooling can evolve.

---

# 37. API Contracts

Use contract-first design.

Recommended:

```text
OpenAPI
JSON Schema
TypeScript types
```

Shared package:

```text
@stackra/contracts
```

Possible contract modules:

```text
@stackra/contracts/auth
@stackra/contracts/iam
@stackra/contracts/tenant
@stackra/contracts/monetization
@stackra/contracts/application
@stackra/contracts/events
```

Never share database entities directly between services.

Share contracts, not persistence models.

---

# 38. IDs

Use domain-specific prefixed IDs where useful:

```text
usr_...
org_...
ten_...
app_...
role_...
perm_...
sub_...
plan_...
ent_...
dom_...
```

Clerk IDs remain Clerk IDs:

```text
user_...
org_...
```

Do not rename Clerk IDs.

---

# 39. Service Ownership

| Domain | Owner |
|---|---|
| Authentication | Clerk |
| User identity | Clerk |
| Clerk organization membership | Clerk |
| Platform authorization | IAM |
| Roles/permissions | IAM |
| Tenant lifecycle | Tenant |
| Tenant configuration | Tenant |
| Domains | Tenant |
| Domain verification | Tenant |
| Application registry | Registry |
| Application metadata | Registry |
| Plans | Monetization |
| Subscriptions | Monetization |
| Billing | Monetization |
| Invoices | Monetization |
| Entitlements | Monetization |
| Metering | Monetization initially |
| Usage | Monetization initially |
| High-volume usage | Extract later |
| Business logic | Individual application |
| Application data | Individual application |
| Central application launcher | Portal |

---

# 40. Service Decision Table

| Service | Subdomain | Runtime | Database | Initial status |
|---|---|---|---|---|
| Identity | `identity.figentra.com` | Clerk | Clerk | External managed |
| IAM | `iam.figentra.com` | NestJS/Node | Supabase PostgreSQL | Build |
| Tenant | `tenant.figentra.com` | NestJS/Node | Supabase PostgreSQL | Build |
| Monetization | `billing.figentra.com` | NestJS/Node | Supabase PostgreSQL | Build |
| Application Registry | `registry.figentra.com` | Cloudflare Worker/Hono | D1 + KV | Build |
| API Gateway | `api.figentra.com` | Cloudflare Worker | — | Build |
| Portal | `app.figentra.com` | Next.js | API-driven | Build |
| Audit | Internal | Node initially | PostgreSQL/event store | Later |
| Usage | Internal | Node initially | PostgreSQL/queue | Later |
| Notifications | Internal | Node initially | PostgreSQL/provider | Later |
| CRM | `crm.figentra.com` | App-specific | Supabase | Product |
| Commerce | `commerce.figentra.com` | App-specific | Supabase | Product |
| POS | `pos.figentra.com` | App-specific | Supabase | Product |
| Analytics | `analytics.figentra.com` | App-specific | Supabase | Product |

---

# 41. Do Not Over-Microservice

The following should NOT automatically become independent microservices:

```text
organization-service
tenant-service
membership-service
permission-service
role-service
plan-service
subscription-service
billing-service
entitlement-service
metering-service
usage-service
domain-service
application-service
```

Instead start with:

```text
IAM
Tenant
Monetization
Registry
```

as the primary platform domains.

Split only when there is a concrete reason:

- independent scaling
- independent deployment
- team ownership
- high volume
- different availability requirements
- security boundary
- infrastructure isolation
- domain maturity

---

# 42. Platform Data Ownership

No service may directly modify another service's database.

Bad:

```text
CRM
  |
  +---- writes IAM DB
```

Good:

```text
CRM
  |
  +---- calls IAM API
  |
  +---- emits event
```

Each service owns its database.

---

# 43. Event-Driven Evolution

Eventually:

```text
Tenant
  |
  +--> tenant.created
          |
          +--> IAM
          +--> Monetization
          +--> Registry
          +--> Audit
```

Example:

```text
subscription.updated
       |
       +--> Entitlement projection
       +--> Application access cache
       +--> Billing
       +--> Audit
```

The platform should be designed so event-driven extraction is possible later.

---

# 44. Security Principles

Mandatory rules:

1. Never trust tenant IDs from the frontend.
2. Never trust organization IDs from arbitrary request bodies.
3. Always validate Clerk identity.
4. Resolve tenant through trusted mapping.
5. Enforce authorization server-side.
6. Use database RLS where applicable.
7. Keep JWT claims small.
8. Do not store secrets in application source code.
9. Use environment/secret management.
10. Log authorization failures without leaking sensitive data.
11. Use correlation/request IDs.
12. Audit administrative/security actions.
13. Do not expose internal service endpoints publicly unless required.
14. Apply rate limiting at the edge.
15. Validate all external webhook signatures.
16. Use idempotency for billing and payment operations.
17. Do not let applications directly mutate platform-owned data.

---

# 45. Domain Security

For custom domains:

```text
custom domain
    |
    v
verification
    |
    v
tenant mapping
    |
    v
application mapping
```

Do not activate a custom domain until ownership verification succeeds.

Support a verification mechanism such as:

```text
DNS TXT
```

and/or an HTTP verification mechanism where appropriate.

Certificates and routing should be managed through the chosen edge/CDN infrastructure.

---

# 46. Billing Security

Billing operations must be idempotent.

Examples:

```text
payment.completed
invoice.created
subscription.updated
```

must tolerate retries.

Use:

```text
idempotency_key
external_event_id
provider_event_id
```

to prevent duplicate processing.

---

# 47. AI Coding-Agent Rules

All AI agents working on Figentra MUST follow these rules.

## Before coding

1. Read this architecture document.
2. Identify the owning domain.
3. Identify the owning service.
4. Check existing contracts.
5. Check existing database migrations.
6. Check existing events.
7. Do not create a new service unless required.

## During coding

1. Follow existing TypeScript conventions.
2. Prefer small composable modules.
3. Use interfaces/types for contracts.
4. Use validation at API boundaries.
5. Add tests for business rules.
6. Add structured logging.
7. Add error handling.
8. Preserve tenant isolation.
9. Preserve service ownership boundaries.
10. Do not introduce infrastructure without justification.

## Before completing

The agent must verify:

```text
Does this belong to the correct service?
Does it preserve tenant isolation?
Does it authenticate correctly?
Does it authorize correctly?
Does it require an entitlement check?
Does it introduce a cross-service database dependency?
Does it require an event?
Does it need an API contract?
Are migrations included?
Are tests included?
```

---

# 48. AI Agent Anti-Patterns

Agents must NOT:

### Duplicate Clerk

Do not create:

```text
password table
session table
custom MFA
```

unless explicitly required.

### Duplicate Tenant Logic

Do not let every application independently create:

```text
tenant
organization
membership
```

models.

### Duplicate Billing

Applications must not independently implement:

```text
subscription
invoice
plan
entitlement
```

logic.

### Direct DB Coupling

Do not:

```text
service A -> service B database
```

### Giant JWT

Do not place all authorization/business data in Clerk claims.

### Microservice Explosion

Do not create a service for every database table.

---

# 49. Example: New Application Onboarding

Adding a new application:

```text
1. Create application metadata
        |
        v
2. Register application
        |
        v
3. Define capabilities
        |
        v
4. Define IAM permissions
        |
        v
5. Define application roles
        |
        v
6. Define monetization entitlements
        |
        v
7. Configure domains
        |
        v
8. Deploy application
        |
        v
9. Enable application for tenant
        |
        v
10. Application becomes visible in portal
```

The application should not need to implement its own identity system.

---

# 50. Example: Tenant Onboarding

```text
User signs up
    |
    v
Clerk user
    |
    v
Create/select Clerk Organization
    |
    v
Figentra Tenant created
    |
    +--> Tenant configuration
    |
    +--> Billing account
    |
    +--> Default subscription
    |
    +--> Default entitlements
    |
    +--> Default domain
    |
    +--> Application access
    |
    v
Portal
```

Provisioning should be idempotent.

---

# 51. Example: Tenant Application Activation

```text
Acme
 |
 +-- Subscription: Enterprise
 |
 +-- Entitlements:
 |      CRM = true
 |      Commerce = true
 |
 +-- IAM:
        Abdelrahman = CRM Admin
        Ahmed = CRM Viewer
```

Portal queries platform data and displays:

```text
CRM       Open
Commerce  Open
POS       No access
```

---

# 52. Example: Request Authorization

Request:

```http
POST https://commerce.figentra.com/api/orders
Authorization: Bearer <Clerk token>
```

Process:

```text
1. Validate Clerk token
2. Extract user
3. Resolve active organization
4. Map organization → tenant
5. Resolve application = commerce
6. IAM check:
      commerce.order.create
7. Entitlement check:
      commerce.orders.enabled
8. Execute Commerce business logic
9. Query database with tenant isolation
10. Emit audit/usage event if required
```

---

# 53. Observability

Every service should have:

```text
request_id
trace_id
user_id
tenant_id
application
service
operation
status
duration
```

Never log:

- passwords
- raw tokens
- secret keys
- payment credentials
- sensitive personal data unnecessarily

Use OpenTelemetry-compatible tracing.

---

# 54. Error Model

Platform APIs should use consistent errors.

Example:

```json
{
  "error": {
    "code": "APPLICATION_ACCESS_DENIED",
    "message": "The user does not have access to this application.",
    "requestId": "req_123"
  }
}
```

Suggested error categories:

```text
AUTHENTICATION_REQUIRED
AUTHENTICATION_INVALID
TENANT_NOT_FOUND
TENANT_SUSPENDED
APPLICATION_NOT_FOUND
APPLICATION_DISABLED
APPLICATION_ACCESS_DENIED
PERMISSION_DENIED
ENTITLEMENT_REQUIRED
SUBSCRIPTION_INACTIVE
DOMAIN_NOT_VERIFIED
VALIDATION_ERROR
RESOURCE_NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

---

# 55. API Versioning

Use:

```text
/api/v1/...
```

for public platform APIs.

Do not break existing contracts without versioning/migration.

Internal service contracts may evolve faster but should still be explicit.

---

# 56. Configuration

Platform configuration should be environment-based.

Example:

```text
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY

DATABASE_URL

REDIS_URL

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN

SENTRY_DSN
```

Never commit secrets.

Use separate configuration for:

```text
development
staging
production
```

---

# 57. Environment Strategy

Recommended:

```text
Development
    |
    v
Staging
    |
    v
Production
```

Applications should have environment-aware registry records:

```text
application
   |
   +-- development
   +-- staging
   +-- production
```

Example:

```json
{
  "application": "crm",
  "environment": "production",
  "url": "https://crm.figentra.com"
}
```

---

# 58. Deployment Architecture

Cloudflare is the **default deployment platform** for Figentra, using two complementary execution models:

1. **Cloudflare Workers** for edge/lightweight services.
2. **Cloudflare Containers** for conventional containerized Node.js/NestJS services.

Cloudflare Containers can run existing container images and applications requiring a full filesystem, specific runtime, Linux environment, more CPU/memory, or heavier workloads. Containers are integrated with Workers and are available on the Workers Paid plan. citeturn1search1turn1search3

The architecture must therefore NOT force every service into the Workers runtime.

```text
                           Cloudflare
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
          Cloudflare Workers              Cloudflare Containers
               |                                 |
       +-------+--------+                 +------+-------+
       |       |        |                 |      |       |
     Gateway Registry  Edge             IAM   Tenant  Billing
       |       |        |                 |      |       |
       +-------+--------+                 +------+-------+
               |                                 |
               +----------------+----------------+
                                |
                                v
                         Supabase PostgreSQL
```

## 58.1 Cloudflare Workers

Use Workers for:

- API Gateway
- Application Registry
- edge routing
- authentication middleware
- rate limiting
- lightweight APIs
- webhook ingress
- request normalization
- routing/proxy functions
- small stateless services
- Workers-native integrations with D1/KV/R2/Queues

Cloudflare recommends bindings rather than calling Cloudflare services through REST APIs, service bindings for Worker-to-Worker communication, Queues/Workflows for asynchronous work, Durable Objects for WebSockets/stateful coordination, and Hyperdrive for external database connections. citeturn0search18

## 58.2 Cloudflare Containers

Use Containers for substantial Node.js services:

```text
IAM
Tenant
Monetization
Audit
Notifications
Provisioning
Other substantial platform services
```

Default runtime:

```text
Node.js 22+
TypeScript
NestJS
Docker
```

Cloudflare Containers support predefined and custom instance types. Current documented predefined types range from 1/16 vCPU / 256 MiB / 2 GB disk through 4 vCPU / 12 GiB / 20 GB disk, with custom limits documented by Cloudflare. This makes them suitable for the initial platform services but not a universal replacement for every compute workload. citeturn1search17

Containers are backed by Workers and Durable Objects; requests are first routed through a Worker. Containers can also access configured Workers bindings through outbound handlers. citeturn1search9turn1search11

### Container rules

- Keep containers stateless.
- Do not use container disk as the system of record.
- Persist business data in PostgreSQL/Supabase or object storage.
- Use queues/events for asynchronous processing.
- Design startup to be fast and deterministic.
- Use health/readiness checks.
- Handle SIGTERM and graceful shutdown.
- Do not assume a process will remain permanently warm.
- Do not rely on local filesystem state across restarts/sleep.
- Keep Docker images small.

Cloudflare documents cold starts for Containers and notes that they can often be around 1–3 seconds depending on image size and startup work. Services must therefore be designed to tolerate cold starts. citeturn1search5

## 58.3 When to use external compute

Cloudflare Containers is the default, but not an absolute requirement.

Use AWS/GCP/Azure or another container platform when a workload needs capabilities that materially exceed the current Cloudflare Container model, such as:

- specialized GPU workloads
- very large memory/CPU requirements
- specialized networking
- infrastructure services unavailable on Cloudflare
- persistent stateful workloads
- long-running compute where Cloudflare economics/behavior are unsuitable
- vendor-specific managed services required by the application

External compute is an **escape hatch**, not the default platform.

---

# 59. Infrastructure as Code

Terraform is the infrastructure source of truth.

Use the following providers:

```text
Cloudflare
Clerk
Supabase
Better Stack
```

The supplied Terraform references are part of the architecture specification:

- Clerk Terraform provider/application resource: `https://registry.terraform.io/providers/buildwithdeck/clerk/latest/docs/resources/application`
- Cloudflare Terraform provider: `https://registry.terraform.io/providers/cloudflare/cloudflare/latest`
- Better Stack Terraform integration: `https://betterstack.com/docs/getting-started/integrations/terraform/`
- Supabase Terraform provider: `https://registry.terraform.io/providers/supabase/supabase/latest/docs`

Cloudflare officially supports managing its configuration with Terraform. citeturn2search1 Better Stack's Terraform integration covers Uptime/on-call resources as well as Telemetry sources, metrics, dashboards and alerts. citeturn1search0

The exact resources supported by each provider must be checked against the provider version pinned by the repository. Do not assume every newly released Cloudflare product is immediately represented by a Terraform resource.

## 59.1 Terraform ownership

Terraform should manage:

```text
Cloudflare
├── zones
├── DNS records
├── routes
├── Workers
├── Worker versions/configuration where supported
├── D1
├── KV
├── R2
├── Queues
├── Durable Objects configuration
├── access/security configuration
└── other supported Cloudflare resources

Clerk
├── applications where supported
├── instances/configuration where supported
└── integration configuration where supported

Supabase
├── projects where supported
├── database configuration where supported
├── settings where supported
└── project-level integrations where supported

Better Stack
├── monitors
├── heartbeats
├── status pages
├── telemetry sources
├── dashboards
├── alerts
└── on-call configuration
```

Terraform must not contain application secrets in plaintext.

Use secret references/environment variables/CI secret stores.

---

# 60. Backend Runtime Standard

There are three backend implementation patterns.

## Pattern A — Worker + Hono

Use for lightweight edge services.

```text
Cloudflare Worker
      |
      v
    Hono
      |
      +-- routes
      +-- middleware
      +-- validation
      +-- bindings
```

Hono is a lightweight Web Standards-oriented framework and has first-class Cloudflare Workers support. Cloudflare explicitly documents Hono for Workers. citeturn0search0turn0search2

Good candidates:

- API Gateway
- Application Registry
- webhooks
- edge APIs
- routing services
- small internal APIs

## Pattern B — Container + NestJS

Use for substantial business services.

```text
Cloudflare Worker
       |
       v
Cloudflare Container
       |
       v
NestJS / Node.js
       |
       v
PostgreSQL
```

Good candidates:

- IAM
- Tenant
- Monetization
- Audit
- Notifications
- Provisioning

## Pattern C — Application-specific runtime

Actual Figentra products may choose a runtime appropriate to their domain, but must comply with platform contracts.

```text
CRM
Commerce
POS
Analytics
```

The platform does not require all applications to use the same internal framework.

---

# 61. Hono Decision

**Use Hono, but do not use Hono for everything.**

Hono is the standard HTTP framework for Cloudflare Worker services.

Do NOT replace NestJS platform services with Hono merely for consistency.

The distinction is:

```text
Cloudflare Worker
    -> Hono

Cloudflare Container
    -> NestJS
```

This gives the team a clear implementation rule while keeping the runtime appropriate to the workload.

If by "Beam2" the intended technology is a specific Cloudflare/Hono library or framework, it must be explicitly evaluated before adoption. Do not introduce an unclear dependency based on name similarity or an AI-generated recommendation.

---

# 62. Frontend Architecture

The default Figentra web stack is:

```text
React
TypeScript
Vite
React Router v7 Framework Mode
Clerk
Tailwind CSS / design system as appropriate
```

React Router v7 Framework Mode is recommended over building a large application around raw declarative routing. Framework Mode integrates with Vite and provides type-safe hrefs, route modules, code splitting, and SPA/SSR/static rendering strategies. citeturn0search7

React Router officially supports starting from Vite and its framework tooling is Vite-based. citeturn0search12turn0search35

## 62.1 Why Vite + React Router v7

This combination is preferred for Figentra because:

- fast development/HMR
- excellent AI-agent compatibility
- explicit routing
- type-safe route modules
- lazy loading/code splitting
- SPA-first architecture
- ability to add SSR later
- straightforward deployment to Cloudflare
- no unnecessary framework coupling

Cloudflare officially documents React + Vite and React Router deployments for Workers. citeturn0search4

## 62.2 Routing model

Use route modules rather than one giant manually constructed route tree.

Example:

```text
app/
├── routes/
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   ├── organizations.tsx
│   ├── applications.tsx
│   ├── settings.tsx
│   └── applications.$applicationKey.tsx
└── root.tsx
```

For application-driven routes:

```text
/applications/:applicationKey
```

or a platform-controlled redirect to:

```text
https://crm.figentra.com
```

The application registry should provide metadata, but the frontend must not generate arbitrary executable routes from untrusted registry data.

## 62.3 Dynamic application launcher

The portal should load:

```text
Application Registry
        +
IAM
        +
Entitlements
        |
        v
Application catalog
```

Then dynamically render:

```text
CRM
Commerce
POS
Analytics
```

No application should need to be hard-coded into the portal's authorization logic.

---

# 63. Frontend Authentication

The frontend uses Clerk as the identity provider.

```text
React Router application
        |
        v
Clerk
        |
        v
Session / Organization
        |
        v
Figentra APIs
```

The frontend may hide UI elements based on permissions, but UI checks are not security boundaries.

Every protected operation must be authorized server-side.

Clerk supports organizations, organization switching and B2B multi-tenancy features. citeturn2search6turn2search11

---

# 64. Service-to-Service Communication

Service-to-service communication is a first-class architectural concern.

There are two categories.

## 64.1 Synchronous service calls

Use HTTP/REST for operations requiring an immediate answer:

```text
Portal -> IAM
Portal -> Tenant
Portal -> Monetization
API Gateway -> IAM
API Gateway -> Tenant
Application -> IAM
Application -> Monetization
```

Example:

```http
POST /v1/authorization/check
```

```json
{
  "tenantId": "ten_123",
  "application": "crm",
  "userId": "user_123",
  "permission": "crm.customer.read"
}
```

Response:

```json
{
  "allowed": true
}
```

## 64.2 Asynchronous communication

Use events for:

- tenant lifecycle
- subscription changes
- entitlement changes
- usage
- audit
- notifications
- provisioning
- long-running tasks

Example:

```text
tenant.created
subscription.updated
entitlement.changed
application.enabled
usage.recorded
domain.verified
```

Cloudflare Workers best practices recommend Queues and Workflows for asynchronous/background work. citeturn0search18

---

# 65. Service-to-Service Authentication

Never use the user's Clerk session token as a generic machine-to-machine credential.

Use one of:

1. **Short-lived service identity tokens**
2. **Workload/service credentials**
3. **Cloudflare-native service bindings where applicable**
4. **mTLS or signed service requests** where required by a security boundary

For internal HTTP calls, establish a standard service authentication mechanism:

```text
X-Figentra-Service: iam
X-Figentra-Request-Id: req_123
Authorization: Bearer <service-token>
```

The exact header names are implementation details; the security properties are mandatory.

Do not trust:

```text
X-Tenant-Id
X-User-Id
X-Role
```

unless they were generated by a trusted upstream service and protected by an authenticated service-to-service channel.

---

# 66. Service Bindings

For Worker-to-Worker communication, prefer Cloudflare Service Bindings over public HTTP where the services are both Cloudflare Workers and a direct binding is appropriate.

Benefits:

- avoids unnecessary public routing
- reduces network overhead
- keeps communication inside the Workers platform
- creates an explicit dependency between services

Cloudflare specifically recommends service bindings for Worker-to-Worker communication. citeturn0search18

Do not use service bindings as a reason to couple all services together. Keep domain boundaries intact.

---

# 67. Worker → Container Communication

The recommended path is:

```text
Client
  |
  v
Cloudflare Worker
  |
  v
Cloudflare Container
  |
  v
NestJS
```

The Worker is responsible for edge concerns:

- routing
- authentication integration
- rate limiting
- request IDs
- basic validation
- traffic policy

The container is responsible for business logic.

Cloudflare's Containers architecture explicitly routes requests through Workers and allows containers to use Workers bindings through outbound handlers. citeturn1search9turn1search11

---

# 68. Database Communication

Services must communicate with another service's **API or event stream**, not its database.

Bad:

```text
CRM Container
    |
    +----> IAM PostgreSQL tables
```

Good:

```text
CRM
 |
 +----> IAM API
 |
 +----> entitlement API
```

For read-heavy authorization, caching/projections may be used, but ownership must remain explicit.

---

# 69. Authorization Gateway Pattern

Applications should not repeatedly implement Clerk token parsing + tenant resolution + IAM logic from scratch.

Provide shared platform middleware/SDK:

```text
@figentra/auth
@figentra/iam-client
@figentra/tenant-client
@figentra/monetization-client
@figentra/platform-sdk
```

The SDK should provide:

```typescript
getAuthenticatedUser()
getActiveOrganization()
resolveTenant()
checkPermission()
requirePermission()
getEntitlement()
requireEntitlement()
```

The SDK must remain a client/contract layer. It must not embed a second authorization database.

---

# 70. Platform Service Specifications

## 70.1 IAM Service

**Runtime:** Cloudflare Container + NestJS

**Database:** Supabase PostgreSQL

**Responsibilities:**

- platform roles
- application roles
- permissions
- role-permission relationships
- tenant/application access
- authorization decisions
- access policies
- service authorization APIs

**Core APIs:**

```text
GET  /v1/me/access
GET  /v1/tenants/:tenantId/applications
POST /v1/authorization/check
POST /v1/roles
POST /v1/roles/:id/permissions
POST /v1/access/grants
DELETE /v1/access/grants/:id
```

**Non-responsibilities:**

- passwords
- sessions
- MFA
- subscription billing
- application business logic

---

## 70.2 Tenant Service

**Runtime:** Cloudflare Container + NestJS

**Database:** Supabase PostgreSQL

**Responsibilities:**

- tenant lifecycle
- Clerk Organization mapping
- tenant status
- configuration
- domains
- domain verification
- tenant routing metadata

**Core APIs:**

```text
GET  /v1/tenants/:id
POST /v1/tenants
PATCH /v1/tenants/:id
POST /v1/tenants/:id/domains
POST /v1/domains/:id/verify
GET  /v1/resolve?hostname=...
```

---

## 70.3 Monetization Service

**Runtime:** Cloudflare Container + NestJS

**Database:** Supabase PostgreSQL

**Responsibilities:**

```text
products
plans
subscriptions
billing accounts
invoices
entitlements
usage
metering
credits
pricing
```

**Core APIs:**

```text
GET  /v1/plans
GET  /v1/tenants/:id/subscription
GET  /v1/tenants/:id/entitlements
POST /v1/tenants/:id/subscriptions
POST /v1/usage
POST /v1/metering/events
```

---

## 70.4 Application Registry

**Runtime:** Cloudflare Worker + Hono

**Database:** D1

**Optional:** KV for cache/configuration

**Responsibilities:**

- application metadata
- application versions
- environments
- URLs
- capabilities
- deployment metadata
- application status
- application branding metadata

**Core APIs:**

```text
GET  /v1/applications
GET  /v1/applications/:key
POST /v1/applications
PATCH /v1/applications/:key
GET  /v1/applications/:key/environments
```

---

## 70.5 API Gateway

**Runtime:** Cloudflare Worker + Hono

**Responsibilities:**

- edge routing
- authentication boundary
- rate limiting
- request IDs
- API versioning
- routing to services
- security headers
- coarse-grained request policy

The gateway must NOT contain application business logic.

---

# 71. Application Service Contract

Every Figentra application must expose a platform-compatible contract.

Minimum capabilities:

```text
GET /health
GET /ready
GET /v1/platform/context
```

The application must accept a trusted platform context containing:

```typescript
interface PlatformContext {
  userId: string;
  tenantId: string;
  clerkOrganizationId: string;
  applicationKey: string;
  requestId: string;
}
```

The exact transport is implementation-specific.

The application remains responsible for:

- domain rules
- application permissions
- business validation
- application data
- application workflows

---

# 72. Frontend Service Architecture

Each major Figentra application should follow:

```text
React Router v7
       |
       +-- route modules
       +-- loaders/actions where appropriate
       +-- UI components
       +-- feature modules
       +-- platform SDK
       |
       v
API Gateway / Application API
```

Suggested structure:

```text
src/
├── routes/
├── features/
├── components/
├── layouts/
├── lib/
├── services/
├── hooks/
├── schemas/
├── types/
└── styles/
```

Do not put all business logic inside route components.

---

# 73. Dynamic Routes and Application-Driven UI

Dynamic routes are allowed and encouraged where they represent actual platform concepts.

Examples:

```text
/organizations/:organizationId
/applications/:applicationKey
/settings/:section
```

Application-specific routes should remain inside the application:

```text
crm.figentra.com/customers/:customerId
commerce.figentra.com/orders/:orderId
```

Do not turn the portal into a generic runtime for arbitrary application pages.

The registry determines **where an application lives**, not how the application's internal UI works.

---

# 74. Frontend Deployment

Default:

```text
React Router v7 + Vite
        |
        v
Cloudflare Workers + Workers Assets
```

Cloudflare's current Workers documentation supports React + Vite and React Router deployments, and Workers Assets are the preferred direction for new static assets deployments. citeturn0search4turn0search18

For applications requiring server rendering, use React Router Framework Mode with the appropriate Cloudflare adapter/deployment strategy.

Do not introduce Next.js solely because it is popular. Use it only where its server-component/full-stack model provides a concrete advantage.

---

# 75. Observability Infrastructure

Use **Better Stack** as the initial centralized observability platform.

Terraform should manage:

```text
monitors
heartbeats
telemetry sources
dashboards
alerts
on-call configuration
status pages
```

Better Stack officially documents Terraform support for Uptime/on-call and Telemetry resources. citeturn1search0

Applications should emit structured logs and OpenTelemetry-compatible telemetry where practical.

Required metadata:

```text
service
version
environment
request_id
trace_id
user_id
tenant_id
application
```

Never log secrets or raw authentication tokens.

---

# 76. Terraform Repository Structure

Recommended:

```text
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── cloudflare-zone/
│   │   ├── cloudflare-worker/
│   │   ├── cloudflare-container/
│   │   ├── d1/
│   │   ├── clerk-application/
│   │   ├── supabase-project/
│   │   └── betterstack/
│   │
│   ├── environments/
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   │
│   └── providers.tf
│
└── cloudflare/
```

The module names are logical boundaries. Use only provider resources actually supported by the pinned provider version.

---

# 77. Terraform Deployment Rule

Infrastructure changes follow:

```text
Code
  |
  v
terraform fmt
  |
  v
terraform validate
  |
  v
terraform plan
  |
  v
Review
  |
  v
terraform apply
```

Application deployment is separate:

```text
Application source
  |
  v
Tests
  |
  v
Docker build (Containers)
  |
  v
Wrangler deploy
```

or, for Workers:

```text
Source
  |
  v
Build
  |
  v
Wrangler deploy
```

Cloudflare's current Container deployment flow uses Wrangler and supports Workers Builds for automated deployment. citeturn1search19

---

# 78. Updated Service Decision Matrix

| Service | Runtime | Framework | Persistence | Communication |
|---|---|---|---|---|
| Identity | Managed | Clerk | Clerk | SDK/API/Webhooks |
| API Gateway | Worker | Hono | None | Service bindings / HTTP |
| Application Registry | Worker | Hono | D1 | HTTP / bindings |
| IAM | Container | NestJS | Supabase PostgreSQL | HTTP/events |
| Tenant | Container | NestJS | Supabase PostgreSQL | HTTP/events |
| Monetization | Container | NestJS | Supabase PostgreSQL | HTTP/events |
| Audit | Container/Worker | NestJS/Hono | PostgreSQL/object store | Events |
| Notifications | Container/Worker | NestJS/Hono | Provider/DB | Events |
| Portal | Worker | React Router v7 + Vite | API-driven | HTTP |
| CRM | Container/Worker | Application-specific | Supabase | HTTP/events |
| Commerce | Container/Worker | Application-specific | Supabase | HTTP/events |
| POS | Container/Worker | Application-specific | Supabase | HTTP/events |
| Analytics | Container/Worker | Application-specific | Supabase | HTTP/events |

---

# 79. Final Deployment Principle

Figentra does not choose one runtime for everything.

It chooses the smallest appropriate runtime:

```text
                 FIGENTRA RUNTIME STANDARD

Lightweight / Edge
        |
        +--> Cloudflare Worker
        |       + Hono
        |
        v
Substantial application/service
        |
        +--> Cloudflare Container
                + Node.js
                + NestJS
                + Docker

Specialized / exceptional workload
        |
        +--> External compute provider
```

This keeps the platform Cloudflare-native without forcing every workload into the Worker execution model.

---

# 80. Recommended Initial Implementation Order

## Phase 1 — Identity

Implement:

```text
Clerk
identity.figentra.com
```

Configure:

- users
- organizations
- MFA
- authentication
- organization selection
- redirects

---

## Phase 2 — Tenant

Implement:

```text
tenant-service
```

Build:

- Clerk org → tenant mapping
- tenant lifecycle
- tenant configuration
- domains
- domain verification

---

## Phase 3 — IAM

Implement:

```text
iam-service
```

Build:

- roles
- permissions
- application access
- authorization APIs
- policy evaluation

---

## Phase 4 — Application Registry

Implement:

```text
registry.figentra.com
```

using:

```text
Cloudflare Worker
D1
KV
```

Build:

- application registration
- application metadata
- versions
- environments
- capabilities
- URLs
- status

---

## Phase 5 — Monetization

Implement:

```text
monetization-service
```

Build:

- products
- plans
- subscriptions
- billing accounts
- invoices
- entitlements
- usage
- metering

---

## Phase 6 — Portal

Implement:

```text
app.figentra.com
```

Build:

- organization switcher
- application launcher
- user profile
- organization settings
- members
- applications
- billing
- domains

---

## Phase 7 — First Application

Build one complete application integration.

Validate:

```text
Authentication
Tenant resolution
IAM
Entitlements
Supabase RLS
Application routing
Application launch
Audit
Usage
```

Only after this integration is correct should additional applications be added.

---

# 81. Final Architecture Decision

The baseline Figentra platform is:

```text
IDENTITY
    |
    +-- Clerk
    |
    +-- identity.figentra.com


IAM
    |
    +-- Users' application access
    +-- Roles
    +-- Permissions
    |
    +-- iam.figentra.com


TENANT
    |
    +-- Clerk Organization mapping
    +-- Tenant lifecycle
    +-- Domains
    +-- Routing context
    |
    +-- tenant.figentra.com


MONETIZATION
    |
    +-- Products
    +-- Plans
    +-- Subscriptions
    +-- Billing
    +-- Invoices
    +-- Entitlements
    +-- Metering
    +-- Usage
    |
    +-- billing.figentra.com


APPLICATION REGISTRY
    |
    +-- Application metadata
    +-- Versions
    +-- Environments
    +-- Capabilities
    |
    +-- Cloudflare Worker
    +-- D1
    +-- registry.figentra.com


API GATEWAY
    |
    +-- Cloudflare Worker
    +-- api.figentra.com


PORTAL
    |
    +-- Next.js
    +-- app.figentra.com


APPLICATIONS
    |
    +-- CRM
    +-- Commerce
    +-- POS
    +-- Analytics
    +-- ...
```

---

# 82. Golden Rules

These rules should be treated as architecture constraints.

### Rule 1

**Clerk owns authentication.**

### Rule 2

**Figentra owns platform authorization.**

### Rule 3

**Clerk Organization and Figentra Tenant are related but distinct concepts.**

### Rule 4

**Tenant owns the domain/routing relationship initially.**

### Rule 5

**Application Registry is lightweight and should use Worker + D1/KV.**

### Rule 6

**Applications own their own business logic and data.**

### Rule 7

**Monetization owns plans, subscriptions, billing, entitlements, metering and usage initially.**

### Rule 8

**Permissions and entitlements are different concepts.**

### Rule 9

**Never trust tenant/application/user identifiers supplied directly by the client.**

### Rule 10

**Use Supabase RLS for defense-in-depth tenant isolation.**

### Rule 11

**Do not split every domain concept into a microservice.**

### Rule 12

**TypeScript/Node.js is the default platform backend language.**

### Rule 13

**NestJS is for substantial backend services; Workers/Hono are for lightweight edge services.**

### Rule 14

**Go is an optimization/extraction choice, not the default language.**

### Rule 15

**Laravel is not the default for the greenfield Figentra platform.**

### Rule 16

**No service may directly write another service's database.**

### Rule 17

**Prefer APIs/events between bounded contexts.**

### Rule 18

**Extract services only when there is a measurable reason.**

### Rule 19

**Keep Clerk JWT claims small.**

### Rule 20

**The architecture must support adding a new Figentra application without redesigning identity, tenant, billing or IAM.**

---



# 84. Architecture Addendum — Cloudflare Containers, Frontend, Terraform & Service Mesh

**Status:** This section supersedes earlier deployment/runtime recommendations wherever they conflict with this section.

The 2026 Figentra baseline uses **Cloudflare as the primary edge and application-compute platform**, with **Cloudflare Workers for edge/lightweight services and Cloudflare Containers for substantial Node.js services**. Cloudflare Containers are now generally available and support container images for arbitrary runtimes/Linux workloads; instances are managed through Workers and can scale to zero. citeturn1search9turn0search9

This means Figentra does **not** need AWS/Railway/Render merely to host NestJS services. External compute remains an escape hatch for workloads that have a concrete incompatibility or operational requirement.

---

# 85. Final Compute Strategy

## 65.1 Cloudflare Workers

Use Workers for:

- API Gateway / edge gateway
- routing and hostname resolution
- Application Registry API
- lightweight webhooks
- authentication middleware
- rate limiting
- edge authorization prechecks
- small APIs
- frontend asset delivery
- Cloudflare-native integrations

Hono is the preferred HTTP framework for these Workers. Cloudflare documents Hono as a lightweight framework that works especially well with Workers and provides official Vite-based React/Hono templates. citeturn0search6

## 65.2 Cloudflare Containers

Use Containers for substantial backend services:

```text
IAM
Tenant
Monetization
Audit
Notification
Application APIs
Background/worker processes where appropriate
```

A Container service should normally be:

```text
Docker image
   |
   v
Cloudflare Container
   |
   v
Node.js 22
   |
   v
NestJS
```

Cloudflare's Container model places a Worker in front of the container and uses Durable Objects for container lifecycle/routing. Container images can be built from a local Dockerfile or referenced from supported registries. citeturn0search0turn1search15

### Important architectural rule

Do not rewrite a substantial NestJS service into Hono merely to deploy it to Cloudflare.

Use:

```text
Hono       -> Worker/edge service
NestJS     -> Container/service application
```

This keeps the service architecture independent from the runtime while taking advantage of Cloudflare's deployment model.

---

# 86. Hono vs NestJS vs Bun

## Hono

Use Hono for:

- Cloudflare Workers
- API Gateway
- Registry
- edge functions
- very small stateless services

Hono should NOT become the default framework for every Figentra backend.

## NestJS

Use NestJS for:

- IAM
- Tenant
- Monetization
- complex application APIs
- transactional business logic
- larger service modules
- services requiring substantial testing and dependency injection

## Bun

Bun is **not the default production runtime** for Figentra platform services.

If the reference to "Beam2" in the original planning means **Bun**, treat Bun as an optional development/runtime experiment rather than an architectural dependency.

The default is:

```text
Node.js 22 LTS
TypeScript
NestJS
```

Bun may be used by individual teams when compatibility has been validated, but shared platform services must not depend on Bun-specific APIs without an explicit ADR.

---

# 87. Frontend Decision — Vite + React Router 7

For the central Figentra portal and application frontends, use:

```text
React
TypeScript
Vite
React Router v7
```

React Router v7 provides Declarative, Data, and Framework modes. Framework Mode adds the Vite plugin, type-safe route modules, code splitting, and SPA/SSR/static rendering strategies. citeturn0search2

## Recommended default

For the Figentra Portal:

```text
React Router v7
Data Mode initially
Vite
SPA
```

Use Framework Mode when the application needs:

- SSR
- SSG
- route-module type safety
- framework-level code splitting
- server rendering

The architecture must not depend on Next.js solely because it is popular.

## Why Vite + React Router

This gives Figentra:

- fast development
- excellent AI-agent compatibility
- explicit routing
- programmatic route generation
- dynamic route trees
- lazy loading
- code splitting
- clean separation between frontend and APIs
- Cloudflare-compatible deployment

React Router v7's Framework Mode is itself built around Vite. citeturn0search2

---

# 88. Frontend Route Architecture

Routes should be generated from application metadata where appropriate, but security must never depend on frontend route generation.

Example:

```text
/application/:applicationKey
/application/:applicationKey/*
```

The portal can load:

```text
Application Registry
        |
        v
available applications
        |
        v
route manifest
        |
        v
React Router
```

Example conceptual route tree:

```text
/
├── login
├── select-organization
├── dashboard
├── settings
│   ├── organization
│   ├── members
│   ├── domains
│   └── billing
└── applications
    ├── crm/*
    ├── commerce/*
    ├── pos/*
    └── analytics/*
```

Application-specific frontends should preferably remain independently deployable rather than forcing every application into one giant frontend bundle.

---

# 89. Frontend Deployment

Recommended:

```text
Cloudflare
   |
   +-- Static assets
   +-- CDN
   +-- Workers/Assets where required
```

For a pure SPA, use Vite to build static assets and Cloudflare to serve them.

For applications requiring SSR, use React Router Framework Mode and the Cloudflare-supported deployment model.

Cloudflare provides official Hono + React + Vite templates and local development through the Cloudflare Vite plugin. citeturn0search6

---

# 90. Microservice Catalog — Final

## 70.1 API Gateway

**Domain:** `api.figentra.com`

**Runtime:** Cloudflare Worker

**Framework:** Hono

**Responsibilities:**

- public API entry point
- routing
- request ID
- authentication token validation/prevalidation
- rate limiting
- CORS policy
- API versioning
- service routing
- edge authorization prechecks

**Must NOT:**

- implement business logic
- access service databases directly
- become a monolith

---

## 70.2 Identity

**Domain:** `identity.figentra.com`

**Provider:** Clerk

**Terraform:** Clerk provider

Responsibilities:

- users
- authentication
- sessions
- MFA
- SSO
- organization membership
- authentication redirects

The current `buildwithdeck/clerk` Terraform provider supports instance resources and, when enabled, Clerk Platform API resources. The `clerk_application` resource can provision Clerk applications and environments, but the Platform API is currently documented as a beta feature requiring enablement. citeturn1search0turn1search2

Do not make Figentra dependent on the Terraform provider being able to create every Clerk object. Runtime identity remains Clerk's responsibility.

---

## 70.3 IAM Service

**Domain:** `iam.figentra.com`

**Runtime:** Cloudflare Container

**Framework:** NestJS

**Database:** Supabase PostgreSQL

Responsibilities:

- roles
- permissions
- role assignments
- application access
- authorization policies
- authorization evaluation
- user/tenant/application access matrix

Example API:

```text
GET  /v1/authorization/context
POST /v1/authorization/check
GET  /v1/roles
POST /v1/roles
GET  /v1/permissions
```

---

## 70.4 Tenant Service

**Domain:** `tenant.figentra.com`

**Runtime:** Cloudflare Container

**Framework:** NestJS

**Database:** Supabase PostgreSQL

Responsibilities:

- Clerk organization mapping
- tenant lifecycle
- tenant settings
- tenant status
- region/data residency metadata
- domains
- hostname resolution metadata
- tenant/application relationship

---

## 70.5 Domain Module

Do NOT create a separate microservice initially.

It is a module inside Tenant:

```text
Tenant Service
   |
   +-- tenant
   +-- domains
   +-- verification
   +-- routing
```

Extract only when domain/DNS/certificate operations become an independent scaling/security boundary.

---

## 70.6 Application Registry

**Domain:** `registry.figentra.com`

**Runtime:** Cloudflare Worker

**Framework:** Hono

**Database:** D1

**Optional:** KV for cache/read optimization

Responsibilities:

- application definitions
- application keys/slugs
- environments
- versions
- deployment metadata
- application URLs
- capabilities
- application status
- branding metadata
- application route metadata

It should NOT contain business data.

---

## 70.7 Monetization Service

**Domain:** `billing.figentra.com`

**Runtime:** Cloudflare Container

**Framework:** NestJS

**Database:** Supabase PostgreSQL

Modules:

```text
catalog
plans
pricing
subscriptions
billing
invoices
entitlements
metering
usage
credits
```

Responsibilities:

- products
- plans
- prices
- subscriptions
- billing accounts
- invoices
- entitlements
- metering
- usage
- provider integrations

Keep these as modules inside one bounded service initially.

---

## 70.8 Audit Service

Initial implementation:

```text
NestJS
Cloudflare Container
PostgreSQL
```

Responsibilities:

- security events
- administrative actions
- tenant events
- IAM changes
- billing events
- domain changes

Later it can evolve into an event-oriented service.

---

## 70.9 Notification Service

Initial implementation:

```text
NestJS
Cloudflare Container
```

Responsibilities:

- email orchestration
- in-app notifications
- webhook notifications
- notification templates
- delivery tracking

Use queues for asynchronous delivery.

---

# 91. Application Service Template

Every Figentra product application should follow a standard contract.

Example:

```text
applications/crm
├── frontend
│   ├── React
│   ├── Vite
│   └── React Router v7
│
└── backend
    ├── NestJS
    ├── Dockerfile
    └── Supabase PostgreSQL
```

The application must implement:

```text
Authentication integration
Tenant context
IAM authorization
Entitlement checks
Tenant-isolated persistence
Audit events
Usage events where applicable
Health endpoints
OpenAPI contract
Observability
```

---

# 92. Service-to-Service Communication

This is a first-class architectural concern.

## 72.1 Synchronous communication

Use HTTPS REST for request/response operations.

Example:

```text
Commerce
   |
   | GET authorization/check
   v
IAM
```

or:

```text
Commerce
   |
   | GET entitlement
   v
Monetization
```

All internal calls must use authenticated service identity.

---

# 93. Service Identity

Do NOT use a user's Clerk token as the only credential for service-to-service calls.

Use a dedicated service identity model.

Conceptually:

```text
service: commerce
service: portal
service: tenant
service: billing
```

Each service receives credentials scoped to the APIs it needs.

Preferred options, in order of applicability:

1. Cloudflare service bindings/internal Worker routing where both sides are Workers.
2. Private/internal HTTPS with short-lived service credentials for Container-to-Container communication.
3. mTLS or stronger workload identity if a future infrastructure requirement demands it.
4. Long-lived static secrets only as a last resort.

Never send:

```text
X-Service-Secret: admin
```

as the sole authorization mechanism.

---

# 94. User Context vs Service Context

Separate these concepts:

```text
USER CONTEXT
-------------
userId
clerkOrganizationId
tenantId
application
roles
permissions

SERVICE CONTEXT
---------------
callingService
serviceIdentity
requestedOperation
traceId
```

A service request may contain both.

Example:

```json
{
  "subject": {
    "userId": "user_123",
    "tenantId": "ten_123",
    "application": "commerce"
  },
  "caller": {
    "service": "portal"
  }
}
```

The receiving service must validate both identity layers.

---

# 95. Service-to-Service Authorization

Define explicit service scopes.

Example:

```text
portal -> tenant.read
portal -> iam.authorization.read
portal -> monetization.subscription.read

commerce -> iam.authorization.check
commerce -> monetization.entitlement.read
commerce -> audit.write
commerce -> usage.write

billing -> tenant.read
billing -> audit.write
billing -> usage.read
```

Principle of least privilege is mandatory.

A service should not receive wildcard permissions such as:

```text
*
admin
root
```

unless it is a tightly controlled infrastructure service.

---

# 96. Synchronous vs Asynchronous Communication

Use synchronous HTTP when the caller needs an immediate answer:

```text
Can this user access CRM?
Does this tenant have entitlement X?
What is the current tenant configuration?
```

Use events/queues when the result does not need to block the request:

```text
usage.recorded
subscription.updated
tenant.created
audit.recorded
email.send
webhook.deliver
```

---

# 97. Event Envelope

All platform events should use a standard envelope:

```json
{
  "id": "evt_123",
  "type": "subscription.updated",
  "version": 1,
  "occurredAt": "2026-08-30T00:00:00Z",
  "source": "monetization",
  "tenantId": "ten_123",
  "subjectId": "sub_123",
  "traceId": "trace_123",
  "data": {}
}
```

Events must be:

- versioned
- idempotently processed
- traceable
- tenant-aware
- backward-compatible where possible

---

# 98. Cloudflare Service Communication

Where practical, keep Cloudflare-native communication inside Cloudflare.

Example:

```text
Worker Gateway
      |
      +-- Worker Registry
      |
      +-- Worker lightweight service
      |
      +-- Container service
```

Cloudflare documents direct Worker/Container integration and Worker bindings for Cloudflare resources. Containers are backed by Workers/Durable Objects and can connect back to Worker functionality through supported mechanisms. citeturn0search5turn0search8

Do not expose every internal service as a public DNS endpoint simply because it exists.

---

# 99. Terraform Architecture

Terraform is the source of truth for infrastructure and provider-managed configuration.

Recommended provider set:

```text
hashicorp/aws             optional escape hatch
cloudflare/cloudflare     primary infrastructure
buildwithdeck/clerk       identity provisioning
supabase/supabase         database/project configuration
Better Stack provider     observability
```

The referenced Cloudflare provider manages Cloudflare configuration through Terraform. citeturn0search10

The current Clerk provider can manage organizations/application settings and, where the Platform API is enabled, applications/instances. citeturn1search0turn1search6

The Supabase Terraform provider remains part of the infrastructure layer for Supabase-managed configuration.

Better Stack should be treated as the observability layer for logs, uptime, tracing/monitoring and incident workflows; the referenced Better Stack documentation exposes Terraform/API integration paths. citeturn1search8

---

# 100. Terraform Repository Structure

```text
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── cloudflare-zone/
│   │   ├── cloudflare-worker/
│   │   ├── cloudflare-container/
│   │   ├── cloudflare-d1/
│   │   ├── cloudflare-queue/
│   │   ├── clerk/
│   │   ├── supabase/
│   │   └── betterstack/
│   │
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   │
│   └── providers.tf
│
├── wrangler/
│   ├── gateway/
│   └── registry/
│
└── docker/
    ├── iam/
    ├── tenant/
    └── monetization/
```

Do not attempt to make Terraform manage every application runtime detail if Wrangler is the authoritative deployment mechanism for Cloudflare Workers/Containers. Terraform should own durable infrastructure/configuration; application build/deploy pipelines should use Wrangler where appropriate.

---

# 101. Terraform vs Wrangler Boundary

This distinction is mandatory.

## Terraform owns

```text
DNS
zones
routes
Cloudflare account infrastructure
queues
D1 databases
KV namespaces
R2 buckets
access/security configuration
Clerk configuration supported by provider
Supabase projects/configuration supported by provider
Better Stack monitors/integrations supported by provider
secrets references/configuration where supported
```

## Wrangler owns

```text
Worker source deployment
Worker bindings that belong to application deployment
Container image build/push/deploy
Container rollout
Worker runtime configuration that is deployment-specific
```

Cloudflare's current Wrangler documentation supports building/pushing container images and deploying Workers/Containers. citeturn1search10turn1search12

Do not create a Terraform resource that fights Wrangler for ownership of the same deploy artifact.

---

# 102. Cloudflare Container Deployment Standard

Every substantial Node.js service must have:

```text
Dockerfile
health endpoint
startup logging
structured logs
readiness behavior
shutdown handling
non-root user where compatible
pinned Node major version
lockfile
```

Example:

```text
services/iam/
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── nest-cli.json
├── src/
└── test/
```

Deployment flow:

```text
Git
 |
 v
CI
 |
 +-- test
 +-- lint
 +-- build
 +-- Docker build
 |
 v
Cloudflare Container Registry
 |
 v
Wrangler deploy
 |
 v
Worker + Container rollout
```

Cloudflare documents that Wrangler can build and push a container image during deployment and that the image is distributed through Cloudflare's network. citeturn1search12turn0search13

---

# 103. Container Lifecycle Rules

Containers can be started on demand and can sleep after an idle timeout, so services must not assume local process memory is durable. Cloudflare's pricing model charges while containers are actively running and supports scale-to-zero behavior. citeturn0search3

Therefore:

DO NOT store durable business state in:

```text
/tmp
process memory
local container filesystem
```

Use:

```text
Supabase PostgreSQL
R2
D1
KV
Durable Object storage
```

according to data semantics.

---

# 104. Data Storage Decision Matrix

| Data | Technology |
|---|---|
| Identity | Clerk |
| Platform relational data | Supabase PostgreSQL |
| Application relational data | Supabase PostgreSQL |
| Application registry | D1 |
| Edge cache/config | KV where appropriate |
| Files/objects | R2 |
| Durable per-instance coordination | Durable Objects where appropriate |
| High-performance shared cache | Redis only where justified |
| Usage/event buffering | Queues |
| Logs | Better Stack |
| Traces | OpenTelemetry + Better Stack/Sentry as selected |

Do not use D1 as a replacement for the primary transactional PostgreSQL platform database.

---

# 105. Observability Standard

Every service must emit:

```text
request_id
trace_id
service
version
environment
user_id when appropriate
tenant_id when appropriate
operation
status
duration
```

Use:

```text
OpenTelemetry
Better Stack
Sentry where useful
Cloudflare observability
```

Better Stack can ingest logs from JavaScript/Node.js, Cloudflare, Docker and other infrastructure sources, making it appropriate as a centralized operational layer. citeturn1search18

---

# 106. Final Platform Runtime Matrix

| Service | Runtime | Framework | Data |
|---|---|---|---|
| Identity | Managed Clerk | Clerk | Clerk |
| API Gateway | Worker | Hono | None/D1/KV as needed |
| Application Registry | Worker | Hono | D1 |
| IAM | Container | NestJS/Node 22 | Supabase PostgreSQL |
| Tenant | Container | NestJS/Node 22 | Supabase PostgreSQL |
| Monetization | Container | NestJS/Node 22 | Supabase PostgreSQL |
| Audit | Container/Worker | NestJS/Hono depending on workload | PostgreSQL/queue |
| Notification | Container/Worker | NestJS/Hono depending on workload | PostgreSQL/queue |
| Portal | Cloudflare | React + Vite + React Router v7 | API-driven |
| CRM frontend | Cloudflare | React + Vite + React Router v7 | API-driven |
| CRM backend | Container | NestJS | Supabase PostgreSQL |
| Commerce frontend | Cloudflare | React + Vite + React Router v7 | API-driven |
| Commerce backend | Container | NestJS | Supabase PostgreSQL |
| POS frontend | Cloudflare | React + Vite + React Router v7 | API-driven |
| POS backend | Container | NestJS | Supabase PostgreSQL |

---

# 107. Service-to-Service Reference Architecture

```text
                           USER
                            |
                            v
                    Cloudflare Edge
                            |
                            v
                     API Gateway
                       Hono/Worker
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
        Portal            Registry          Identity
          |              Worker/D1           Clerk
          |
          +------------------+
          |                  |
          v                  v
         IAM               Tenant
      NestJS/Container  NestJS/Container
          |                  |
          +--------+---------+
                   |
                   v
              Monetization
             NestJS/Container
                   |
                   v
              Supabase PG
                   |
          +--------+---------+
          |        |         |
          v        v         v
         CRM    Commerce     POS
       Container Container Container
          |        |         |
          +--------+---------+
                   |
                   v
              Event / Queue
                   |
          +--------+---------+
          |        |         |
          v        v         v
        Audit   Usage     Notifications
```

---

# 108. Final Frontend Architecture

The default Figentra frontend stack is:

```text
React
TypeScript
Vite
React Router v7
TanStack Query where server-state caching is required
Zod for runtime validation
Tailwind CSS where appropriate
```

Do not put business authorization logic only in React Router.

Frontend routes are UX/navigation.

Backend authorization is security.

The frontend may hide routes based on IAM state, but every backend request must independently authorize the action.

---

# 109. Dynamic Application Routing

The Portal should support an application registry-driven navigation model.

Example registry response:

```json
{
  "applications": [
    {
      "key": "crm",
      "url": "https://crm.figentra.com",
      "enabled": true
    },
    {
      "key": "commerce",
      "url": "https://commerce.figentra.com",
      "enabled": true
    }
  ]
}
```

The portal can construct navigation dynamically.

However, do not dynamically execute arbitrary JavaScript received from the registry.

The registry controls **metadata and routing**, not arbitrary executable frontend code.

---

# 110. Frontend Micro-Frontend Decision

Do NOT start with a complex micro-frontend framework.

Use independently deployed applications:

```text
app.figentra.com
crm.figentra.com
commerce.figentra.com
pos.figentra.com
```

and shared packages:

```text
@figentra/ui
@figentra/auth
@stackra/contracts
@figentra/client
@figentra/router
```

This gives application independence without introducing runtime module federation complexity.

Consider Module Federation only when independent teams need runtime composition of UI modules and there is a demonstrated business requirement.

---

# 111. CI/CD Standard

Every service follows:

```text
Pull Request
    |
    +-- typecheck
    +-- lint
    +-- unit tests
    +-- integration tests
    +-- security checks
    |
    v
Build
    |
    +-- frontend artifact
    +-- Docker image
    |
    v
Staging
    |
    +-- smoke tests
    |
    v
Production
```

Cloudflare Worker/Container deployment should be executed through Wrangler in CI.

Terraform should run separately for infrastructure changes.

---

# 112. Architecture Decision — Final

The final Figentra platform is intentionally built around **one identity, multiple tenants, multiple applications, and independent application business domains**.

The preferred technology boundaries are:

```text
Clerk
  -> Identity

Cloudflare Workers + Hono
  -> Edge
  -> Gateway
  -> Registry
  -> Lightweight APIs

Cloudflare Containers + Node.js + NestJS
  -> Substantial platform services
  -> Application backends

React + Vite + React Router v7
  -> Portal
  -> Application frontends

Supabase PostgreSQL
  -> Transactional relational data

D1
  -> Registry/configuration data

R2
  -> Object storage

Queues
  -> Async work

Terraform
  -> Infrastructure state

Wrangler
  -> Worker/container application deployment

Clerk Terraform Provider
  -> Supported Clerk configuration

Better Stack
  -> Operational observability
```

This architecture minimizes infrastructure complexity while preserving clear service boundaries and an escape path to external compute if a workload later requires it.

---

# 113. Referenced Infrastructure Documentation

The following resources are part of the Figentra infrastructure reference set:

- Clerk Terraform provider / `clerk_application`: urlClerk Terraform application resourcehttps://registry.terraform.io/providers/buildwithdeck/clerk/latest/docs/resources/application
- Cloudflare Terraform provider: urlCloudflare Terraform providerhttps://registry.terraform.io/providers/cloudflare/cloudflare/latest
- Better Stack Terraform/infrastructure documentation: urlBetter Stack documentationhttps://betterstack.com/docs/getting-started/integrations/terraform/
- Supabase Terraform provider: urlSupabase Terraform providerhttps://registry.terraform.io/providers/supabase/supabase/latest/docs
- Cloudflare Containers: urlCloudflare Containers documentationhttps://developers.cloudflare.com/containers/
- Cloudflare Hono/React/Vite integration: urlCloudflare Hono documentationhttps://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- React Router v7 modes: urlReact Router v7 documentationhttps://reactrouter.com/start/modes

These are reference documents, not substitutes for the architecture rules in this file.

# 83. Target End State

```text
                              FIGENTRA
                                  |
                  +---------------+---------------+
                  |                               |
                  v                               v
             Clerk Identity                 Figentra Portal
                  |                               |
                  |                               |
                  +---------------+---------------+
                                  |
                                  v
                         API Gateway / Edge
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
            IAM                 Tenant            Monetization
             |                    |                    |
             |                    +-- Domains           +-- Plans
             |                                         +-- Subs
             |                                         +-- Billing
             |                                         +-- Entitlements
             |                                         +-- Usage
             |
             +------------------+
                                |
                                v
                       Application Registry
                                |
                 +--------------+--------------+
                 |              |              |
                 v              v              v
                CRM          Commerce          POS
                 |              |              |
                 v              v              v
             Supabase       Supabase       Supabase
             PostgreSQL     PostgreSQL     PostgreSQL
                 |              |              |
                 +--------------+--------------+
                                |
                                v
                         Tenant-isolated data
```

The platform's central abstraction is:

```text
ONE IDENTITY
     |
MANY ORGANIZATIONS
     |
MANY TENANTS
     |
MANY APPLICATIONS
     |
APPLICATION-SPECIFIC ROLES
     |
APPLICATION-SPECIFIC PERMISSIONS
     |
TENANT-SPECIFIC ENTITLEMENTS
     |
INDEPENDENT APPLICATION DATA
```

This architecture is the baseline that all future Figentra services and applications should follow unless an explicit architecture decision record (ADR) supersedes it.
