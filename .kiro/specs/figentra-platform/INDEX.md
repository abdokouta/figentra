# Figentra Platform — Kiro Specification Index

Read `README.md` first, then `ARCHITECTURE.md` and `SERVICE-CATALOG.md`. These are the normative platform architecture and service inventory. Use `00-implementation-checklist.md` and the component directories for implementation.

## Canonical architecture documents

- `README.md` — consolidated repository architecture/engineering contract
- `ARCHITECTURE.md` — locked runtime, ownership, identity, communication and data boundaries
- `SERVICE-CATALOG.md` — canonical count and review order of all services
- `messaging.md` — NATS/JetStream/Redis/Kafka messaging contract
- `00-implementation-checklist.md` — implementation gates

## Directories

- `services/` — deployable NestJS bounded contexts
- `packages/` — reusable platform libraries/contracts
- `workers/` — independent Cloudflare edge/control-plane workers only
- `apps/` — web/mobile/public applications
- `stackra/` — external Stackra package usage contracts

## Service count

**18 canonical deployable services:** Identity, Tenant, Scope, IAM, Policy, Approval, Monetization, Entitlements, Usage, Notifications, Audit, Files, Integrations, Reporting, Search, Workflow, Analytics, Marketing.

Worker roles inside these services do not increase the service count. Gateway, Registry and Infrastructure Orchestrator are independent Cloudflare runtime components, not additional business services.

## Messaging rule

NATS + JetStream is the canonical durable service messaging platform. Redis is support infrastructure. Kafka requires an ADR.

## Rule

No implementation task is complete if it satisfies code compilation but violates its component spec. Any required architectural deviation becomes an ADR before implementation.
