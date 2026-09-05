---
status: canonical
document: service-definition-of-done
service: tenant
version: v1
---
# Tenant Service — Production Definition of Done

Tenant is production-ready only when all gates are implemented and proven in production-like staging.

- [ ] Architecture/source/module boundaries match `01`/`02`; no Scope service, no deferred lifecycle/tenancy architecture, no placeholder adapters.
- [ ] Every route/controller/DTO/error/auth rule in `03-api.md` exists, including lifecycle, organizations, memberships, domains and settings.
- [ ] Every schema/index/unique/check/tenant/version constraint in `04-data-model.md` is migrated and query-plan tested.
- [ ] Tenant lifecycle, membership/domain/settings invariants and optimistic concurrency are race-tested.
- [ ] Every event/stream/subject/consumer/DLQ in `05`/`11` has versioned contracts, transactional outbox/inbox, duplicate/redelivery/replay/crash tests and IaC.
- [ ] Every worker/job/schedule is idempotent, bounded, occurrence-keyed/locked where required, observable and drainable.
- [ ] Every email/in-app/security notification and realtime channel in `12` is implemented with tenant branding/locale/dedupe and strict IAM subscription authorization.
- [ ] Every middleware/guard/interceptor/pipe/filter/observer/controller in `13` exists and framework ordering/bootstrap/shutdown tests pass.
- [ ] All operational configuration and tenant setting schemas are typed, validated, versioned and classified; no magic JSON settings alter security.
- [ ] Registry projection includes routes, resources, permissions, settings schemas, events, consumers, workers, schedules, notifications, realtime, health and dependencies; it contains no tenant business data/secrets.
- [ ] Dependency graph is acyclic; no direct Identity/IAM implementation/database import exists.
- [ ] Redis failure cannot cross tenant boundaries; IAM/Identity failure never fabricates access; DNS failure never yields false domain verification.
- [ ] Archive/suspend immediately enforce lifecycle semantics independent of async cleanup.
- [ ] Tenant erasure/archive/retention/legal-hold/backup-restore workflows are idempotent and tested without direct deletion of other-service databases.
- [ ] Expand/contract migrations, setting/event/cache/context-version evolution and mixed-version rollout/rollback pass.
- [ ] Unit, integration, contract, security, E2E, load, resilience, migration and smoke suites pass, including forged tenant context, membership race, stale cache, duplicate invitation/domain verification, archive/write races and cross-tenant access.
- [ ] Observability covers lifecycle/membership/domain/context/cache/consumer/job latency/errors/lag, SLOs, dashboards, alerts and runbooks.
- [ ] API/consumer/worker/scheduler independently scale, gracefully drain, canary/rollback, and meet RPO/RTO restore/reconciliation targets.
- [ ] No undocumented route, event, queue, consumer, worker, schedule, notification, realtime channel, setting, permission, capability or dependency exists.

Any known path to cross-tenant leakage, stale membership access, false verified domain, lifecycle bypass, hidden runtime work or unversioned settings blocks release.