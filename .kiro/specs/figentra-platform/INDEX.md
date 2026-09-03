# Figentra Platform — Kiro Specification Index

Read `README.md` first, then `ARCHITECTURE.md` and `SERVICE-CATALOG.md`. These are the normative platform architecture and service inventory. Use `00-implementation-checklist.md` and component directories for implementation.

## Canonical architecture documents

- `README.md` — consolidated repository architecture/engineering contract
- `ARCHITECTURE.md` — locked ownership, runtime, identity, communication and data boundaries
- `SERVICE-CATALOG.md` — canonical 14-service inventory and review order
- `messaging.md` — NATS/JetStream/Redis/Kafka messaging contract
- `00-implementation-checklist.md` — implementation gates

## Canonical runtime components

- `workers/01-gateway.md` — independent Cloudflare Worker + Hono public edge gateway
- `workers/02-registry.md` — independent Cloudflare Worker + Hono application registry/control-plane metadata
- `workers/03-infrastructure-orchestrator.md` — independent Cloudflare Worker for infrastructure orchestration/control endpoints

Service background processing is not represented as separate worker applications. API, consumer, worker and scheduler roles remain part of the owning NestJS service source tree unless an ADR proves an independent boundary.

## Directories

- `services/` — deployable NestJS bounded contexts
- `packages/` — reusable platform libraries/contracts
- `workers/` — independent Cloudflare edge/control-plane workers only
- `apps/` — product/public applications
- `stackra/` — Stackra package usage contracts

## Service count

**14 canonical deployable services:** Identity, Tenant, IAM, Monetization, Usage, Workflow, Notifications, Audit, Files, Integrations, Search, Reporting, Analytics, Marketing.

### Removed standalone boundaries

- Scope → Tenant context + product-owned resource hierarchy + IAM evaluation context
- Policy → IAM
- Approval → Workflow human-task/workflow primitive
- Entitlements → Monetization commercial-access model

## Communication

HTTPS + OpenAPI + typed SDK is the default synchronous service contract. NATS + JetStream is the canonical durable asynchronous transport. Redis is cache/coordination infrastructure. Kafka requires an ADR. Cloudflare Service Bindings are preferred for compatible Worker-to-Worker communication.

## Rule

No implementation task is complete if it satisfies compilation but violates its component spec. Any architectural deviation becomes an ADR before implementation.
