# Figentra Enterprise Architecture — V1 Expanded

This repository is the architectural source of truth for Figentra.

It is deliberately designed as a **decision-driven architecture**, not a collection of speculative microservices.

## Goal

Build an enterprise-grade platform/control plane that can support many independent applications while providing shared capabilities:

- Identity
- Principals
- Credentials
- IAM
- Tenant context
- Dynamic Scope
- Policies
- Approvals
- Audit
- Application Registry Worker
- Domains
- Monetization
- Entitlements
- Usage/Metering
- Integrations/App Store
- Notifications
- Workflows
- Events
- Search
- Reporting
- Deployment
- Observability

Applications retain ownership of their own business logic and business data.

## Critical architectural constraint

Figentra must not assume a universal business hierarchy.

Valid application models may be:

```text
Tenant → Organization → Team → Resource
Tenant → Organization → Branch → Warehouse → Channel
Tenant → Region → Venue → Building → Floor → Zone
Tenant → Project → Site → Asset
```

The platform therefore provides generic context primitives rather than hard-coding these structures.

## Working method

Architecture is developed in pieces.

Every area progresses:

```text
PROPOSED
   ↓
DISCUSSION
   ↓
APPROVED
   ↓
IMPLEMENTED
   ↓
VERIFIED
```

A decision is not considered architectural truth until recorded as an ADR.

## Current major decisions

1. Supabase is the V1 authentication and managed PostgreSQL foundation from day one.
2. Authentication is not built from scratch.
3. Figentra owns the canonical Identity contract above the Supabase Auth provider.
4. Principal is the single authorization-subject abstraction.
5. No Person entity.
6. No User entity.
7. Service accounts are principals.
8. Identity + Principal initially form one Identity Platform bounded context.
9. IAM is Figentra-owned and separate from authentication.
10. Supabase Auth roles/permissions are not the Figentra IAM source of truth.
11. Tenant and Scope are separate.
12. Scope is dynamic and application-defined.
13. No SDUI.
14. No Refine.
15. Vite + React + React Router 7 + HeroUI + internal Query/State/HTTP packages are the frontend foundation.
16. TypeScript is the default language for new platform services.
17. Hono is preferred for lightweight/edge HTTP services; Node.js/container runtimes are used where process/runtime requirements justify them.
18. Service-to-service authentication is explicit and uses service principals and short-lived audience-bound credentials.
19. Infrastructure identity and Figentra service identity are separate.
20. Applications own business data; platform services own their platform data.
21. APIs and events are versioned contracts.
22. Events use durable delivery and idempotent consumers.
23. Existing packages are reference material, not architectural constraints.

## Important non-goals

- Build our own authentication cryptography
- Recreate Supabase Auth
- Create a universal User/Person model
- Make Supabase Auth organizations the universal tenancy model
- Make IAM understand application-specific business entities
- Build SDUI
- Make Refine a core dependency
- Make every module a microservice
- Use Kafka simply because it sounds enterprise
- Build a complete PaaS before deployment requirements justify it

## Supabase V1 boundary

Supabase is the V1 foundation from day one:

```text
Supabase Auth
      ↓
Figentra Identity
      ↓
Principal
      ↓
IAM
```

Supabase PostgreSQL is the preferred managed PostgreSQL foundation for V1 where it fits the workload.

Supabase-specific authentication semantics remain behind the Identity provider adapter. The Figentra Identity ID remains canonical.

Supabase Auth is not the Figentra IAM source of truth.

Supabase RLS is defense-in-depth and does not replace Figentra IAM.

## Runtime architecture

```text
Cloudflare Worker/Hono
  ├── API Gateway
  └── Application Registry

Convoy
  └── Webhook Gateway

NestJS
  └── substantial platform/domain services
```

Convoy is the initial webhook infrastructure. It is containerized and portable rather than a custom Worker.


## Official scaffolding policy

The actual implementation must use official generators:

### HeroUI V3 + Vite

Use the official HeroUI V3 Vite template/CLI documented at:

https://v2.heroui.com/docs/frameworks/vite

The project intentionally stays on HeroUI V3 because that is the explicitly selected architecture, even though the current HeroUI documentation recommends V3 for new projects.

### NestJS

Use the official Nest CLI:

```bash
nest new <service> --package-manager pnpm --strict
```

### Cloudflare/Hono

Use the official Hono Cloudflare Worker template:

```bash
pnpm create hono@latest <worker> --template cloudflare-workers
```

For a Vite-integrated Worker, use the official `cloudflare-workers+vite` template.

### Convoy

Use the official Docker/self-hosted deployment model rather than inventing a Worker implementation.

## V12 enterprise completion pass

This repository now treats configuration as a documented declarative system:

- every YAML/YML manifest has a file-level documentation contract;
- deployables use `cloud.yaml` as their deployment metadata source of truth;
- dev/stg/prd have explicit environment manifests;
- Terraform remains the durable infrastructure authority;
- Docker Compose is generated for local development only;
- NATS is the internal messaging default;
- JetStream is the durable event stream;
- the transactional outbox is service-owned and MikroORM/PostgreSQL-backed;
- Gateway performs Identity verification, IAM authorization, token exchange,
  rate limiting, route discovery, timeout, and circuit breaking;
- Registry enforces service-principal registration, permissions, manifest schema,
  versioning, audit, and upstream SSRF controls;
- Cloudflare WAF/rate limiting is managed through Terraform;
- Wrangler resource IDs are rendered from Terraform outputs;
- Supabase Auth is the V1 Identity/JWKS provider.

See `TASKLIST.md` for the exact distinction between repository-complete work
and external provisioning gates that require protected cloud credentials.


## Worker architecture

Gateway and Registry are Hono Workers. Infrastructure Orchestrator is a Hono
control plane backed by Cloudflare Workflows and a dedicated Terraform Container.
Terraform source remains canonical under `infrastructure/terraform`; the Worker
does not become a second Terraform source tree.


## Infrastructure layout

- `infrastructure/docker` — Docker/Compose/PostgreSQL support and generation.
- `infrastructure/terraform` — Terraform provisioning and Terraform scripts.
- `scripts` — repository-wide automation only.
