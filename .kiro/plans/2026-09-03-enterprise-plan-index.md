---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# Figentra — Enterprise Day-One Plan Index

**Planning standard:** `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
**Master plan:** `.kiro/plans/00-master-platform-plan.md`
**Service/runtime standard:** `.kiro/plans/01-global/service-worker-architecture.md`

## Ownership model

This index separates implementation ownership cleanly:

- **Packages:** reusable technical/platform libraries and genuine SDKs.
- **Services:** business/domain bounded contexts; implementation lives under `services/<service>/src/modules`.
- **Worker roles:** API/consumer/worker/scheduler deployments of the owning service source tree.
- **Contracts:** versioned cross-service DTOs, schemas, commands, queries, events, errors and public protocol interfaces in `@stackra/contracts`.
- **Cloudflare Workers:** explicit edge/serverless workloads only.

There is no default package + service + worker triplet.

## Canonical reusable packages

### Base

- `.kiro/plans/packages/base/contracts.md` — `@stackra/contracts`
- `.kiro/plans/packages/base/container.md` — `@stackra/container`
- `.kiro/plans/packages/base/support.md` — `@stackra/support`
- `.kiro/plans/packages/base/errors.md` — `@stackra/errors`
- `.kiro/plans/packages/base/config.md` — `@stackra/config`
- `.kiro/plans/packages/base/logger.md` — `@stackra/logger`
- `.kiro/plans/packages/base/observability.md` — `@stackra/observability`
- `.kiro/plans/packages/base/storage.md` — `@stackra/storage`
- `.kiro/plans/packages/base/cache.md` — `@stackra/cache`
- `.kiro/plans/packages/base/database.md` — `@stackra/database`
- `.kiro/plans/packages/base/orm.md` — `@stackra/orm`
- `.kiro/plans/packages/base/schema.md` — `@stackra/schema`
- `.kiro/plans/packages/base/pagination.md` — `@stackra/pagination`
- `.kiro/plans/packages/base/state-machine.md` — `@stackra/state-machine`
- `.kiro/plans/packages/base/pipeline.md` — `@stackra/pipeline`
- `.kiro/plans/packages/base/http.md` — `@stackra/http`
- `.kiro/plans/packages/base/nats.md` — `@stackra/nats`
- `.kiro/plans/packages/base/realtime.md` — `@stackra/realtime`
- `.kiro/plans/packages/base/link.md` — `@stackra/link`

### Reusable capabilities / SDKs

- `.kiro/plans/packages/capabilities/identity.md` — `@stackra/identity`; authentication + identity SDK boundary.
- `.kiro/plans/packages/capabilities/tracking.md` — `@stackra/tracking`; client behavioral collection SDK.
- `.kiro/plans/packages/capabilities/events.md` — `@stackra/events`; domain/application event infrastructure.
- `.kiro/plans/packages/capabilities/queue.md` — `@stackra/queue`; durable job abstraction.
- `.kiro/plans/packages/capabilities/sync.md` — `@stackra/sync`; reusable offline synchronization engine.
- `.kiro/plans/packages/capabilities/search.md` — `@stackra/search`; provider-neutral indexing/search abstraction.
- `.kiro/plans/packages/capabilities/media.md` — `@stackra/media`; reusable media boundary where domain-neutral.
- `.kiro/plans/packages/capabilities/workflow.md` — `@stackra/workflow`; durable workflow runtime.
- `.kiro/plans/packages/capabilities/query.md` — `@stackra/query`; reusable query infrastructure only.
- `.kiro/plans/packages/capabilities/state.md` — `@stackra/state`; reusable state infrastructure only.

No domain implementation package is created for Notifications, Analytics, Marketing or Audit.

## Runtime and UI packages

- `.kiro/plans/packages/runtime/node.md` — `@stackra/node`
- `.kiro/plans/packages/runtime/nestjs.md` — `@stackra/nestjs`
- `.kiro/plans/packages/runtime/browser.md` — `@stackra/browser`
- `.kiro/plans/packages/runtime/react.md` — `@stackra/react`
- `.kiro/plans/packages/runtime/react-native.md` — `@stackra/react-native`
- `.kiro/plans/packages/runtime/desktop.md` — `@stackra/desktop`
- `.kiro/plans/packages/runtime/worker.md` — `@stackra/worker`
- `.kiro/plans/packages/ui/router.md` — `@stackra/router`
- `.kiro/plans/packages/ui/navigation.md` — `@stackra/navigation`
- `.kiro/plans/packages/ui/i18n.md` — `@stackra/i18n`
- `.kiro/plans/packages/ui/theming.md` — `@stackra/theming`
- `.kiro/plans/packages/ui/ui.md` — `@stackra/ui`

## Canonical services

Each service owns its domain implementation under `services/<name>/src/modules` and may expose API, NATS consumer, worker and scheduler roles from that same source tree.

- `.kiro/plans/services/identity.md`
- `.kiro/plans/services/tenant.md`
- `.kiro/plans/services/scope.md`
- `.kiro/plans/services/iam.md`
- `.kiro/plans/services/policy.md`
- `.kiro/plans/services/approval.md`
- `.kiro/plans/services/monetization.md`
- `.kiro/plans/services/entitlements.md`
- `.kiro/plans/services/usage.md`
- `.kiro/plans/services/notifications.md`
- `.kiro/plans/services/audit.md`
- `.kiro/plans/services/files.md`
- `.kiro/plans/services/integrations.md`
- `.kiro/plans/services/reporting.md`
- `.kiro/plans/services/search.md`
- `.kiro/plans/services/workflow.md`
- `.kiro/plans/services/analytics.md`
- `.kiro/plans/services/marketing.md`

## Independent workers

Top-level `.kiro/plans/workers/` is reserved for genuinely independent worker applications. Service-owned background processing must remain a service runtime role. Existing exceptional workers (gateway/registry/infrastructure-orchestrator) require their existing ADR/spec boundary to remain valid.

## Applications

Applications consume service APIs/events and public contracts and may use reusable SDK packages. They never import service implementation internals.

## Governance / infrastructure

- `.kiro/plans/01-global/service-worker-architecture.md`
- `.kiro/plans/01-global/infrastructure-docker-terraform.md`
- `.kiro/plans/01-global/monitoring-infrastructure.md`
- `.kiro/plans/01-global/gap-closure-2026-09-03.md`
- `.kiro/plans/2026-09-03-global-standards-plan.md`
- `.kiro/plans/2026-09-03-adr-reconciliation-plan.md`
- `.kiro/plans/2026-09-03-implementation-checklist-plan.md`

## Removed duplicate targets

The following are intentionally absent from the canonical graph:

- standalone `@stackra/auth`;
- `@stackra/notifications` domain package;
- `@stackra/analytics` domain package;
- `@stackra/marketing` domain package;
- mirrored `workers/<service>` implementations where the owning service can provide the worker role.

## Plan quality gate

Every package/service/runtime plan must define ownership, exact source layout, public contracts, dependencies, DI/lifecycle, configuration, security, errors/recovery, observability, concurrency/resource limits, tenancy/isolation, persistence/migrations where applicable, tests, deployment and exit criteria. No TODO, target shim, placeholder provider, fake production driver or deferred architecture may be used as the target design.
