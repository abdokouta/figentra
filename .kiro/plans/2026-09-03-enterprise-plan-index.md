---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# Figentra — Enterprise Day-One Plan Index

**Planning standard:** `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`  
**Master plan:** `.kiro/plans/00-master-platform-plan.md`  
**Architecture/spec index:** `.kiro/specs/figentra-platform/INDEX.md`

## Ownership model

- **Packages:** reusable technical/platform capabilities and SDKs.
- **Services:** business/domain bounded contexts under `services/<service>/src/modules`.
- **Service runtime roles:** API, consumer, worker and scheduler from the owning NestJS source tree.
- **Independent Workers:** only explicitly justified Cloudflare edge/control-plane applications.
- **Contracts:** versioned cross-service DTOs, schemas, commands, queries, events, errors and protocol interfaces in `@stackra/contracts`.
- **Applications:** product experiences and application-owned business rules/data.

## Canonical services — 14

1. Identity
2. Tenant
3. IAM
4. Monetization
5. Usage
6. Workflow
7. Notifications
8. Audit
9. Files
10. Integrations
11. Search
12. Reporting
13. Analytics
14. Marketing

Retired standalone boundaries: Scope → Tenant/IAM context; Policy → IAM; Approval → Workflow; Entitlements → Monetization.

## Canonical package groups

### Base

`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`, `events`, `security`, `coordinator`

### Capabilities

`identity`, `tracking`, `workflow`, `sync`, `queue`, `query`, `state`, `media`, `search`, `audit`

### Runtime foundations

`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`

### UI

`router`, `navigation`, `i18n`, `theming`, `ui`

### Tooling

`build`, `testing`, plus console/Vite/OpenAPI tooling when implemented; tooling integration plans live under `.kiro/plans/packages/tooling/`.

## Package decomposition law

```text
capability          → package
provider/driver     → subpath
runtime integration → subpath
framework adapter   → subpath
testing integration → subpath
```

Independent runtime foundations remain standalone only when they provide shared platform primitives across multiple capabilities.

## Independent Cloudflare Workers

- `.kiro/plans/workers/gateway.md` — public edge gateway, Hono.
- `.kiro/plans/workers/registry.md` — Application Registry, Hono + D1/KV.
- `.kiro/plans/workers/infrastructure-orchestrator.md` — infrastructure control/orchestration edge component.

The Application Registry is **not** a NestJS service. The authoritative specification selects Cloudflare Worker + Hono and D1 for registry metadata, with KV used only as cache/optimization. fileciteturn601file0

## Global implementation plans

- `01-global/service-worker-architecture.md`
- `01-global/infrastructure-docker-terraform.md`
- `01-global/messaging-nats-jetstream-redis-kafka.md`
- `01-global/monitoring-infrastructure.md`
- `01-global/gap-closure-2026-09-03.md`
- `2026-09-03-global-standards-plan.md`
- `2026-09-03-enterprise-observability-plan.md`
- `2026-09-03-enterprise-day-one-plan-standard.md`
- `2026-09-03-adr-reconciliation-plan.md`
- `2026-09-03-implementation-checklist-plan.md`

## Canonical quality gate

Every package, service, independent Worker and tooling/runtime plan must define ownership, exact source layout, contracts/public exports, dependencies, lifecycle/DI, configuration, security, tenancy/isolation where applicable, errors/recovery, observability, concurrency/resource limits, persistence/migrations where applicable, tests/conformance, deployment and exit criteria. No TODO/TBD, fake production provider, target shim or deferred architectural decision is allowed.
