---
status: canonical
document: service-definition-of-done
service: iam
version: v1
---
# IAM Service — Production Definition of Done

IAM is complete only when the running production implementation satisfies every gate.

- [ ] Architecture/source/modules match `01`/`02`; no deferred authorization architecture, TODO evaluator, fake provider or placeholder adapter.
- [ ] Every controller/route/DTO/error in `03-api.md` exists with explicit auth, tenant, rate-limit and audit behavior.
- [ ] Every role/permission/policy/grant/decision schema/index/constraint/migration in `04-data-model.md` is implemented and query-plan tested.
- [ ] Explicit deny precedence, deny-by-default, expiry, delegation attribution, tenant/resource hierarchy and typed bounded policy AST are implemented and property-tested.
- [ ] Every event/subject/stream/consumer/DLQ in `05-events.md`/`11-messaging.md` has a versioned contract, transactional outbox/inbox, duplicate/redelivery/crash/replay tests and IaC.
- [ ] Every job/schedule/worker is idempotent, bounded, locked/checkpointed where needed, observable and gracefully drainable.
- [ ] Every security notification and realtime channel in `12` is implemented with tenant/IAM subscription control and no sensitive policy leakage.
- [ ] Every middleware/guard/interceptor/pipe/filter/observer/controller in `13` exists and ordering/bootstrap/shutdown tests pass.
- [ ] Every configuration setting is typed/safety-bounded; production cannot disable core security invariants.
- [ ] Registry projection contains routes, permissions, resources/actions, policy schema, events, consumers, workers, schedules, notifications, realtime, settings, health and dependencies; Registry is never authorization source of truth.
- [ ] Compile/runtime dependency graph is acyclic and no Identity/Tenant implementation/ORM import exists.
- [ ] Redis loss/staleness never creates an allow; DB/Tenant/evaluator errors fail closed.
- [ ] Grant expiry is enforced synchronously independent of scheduler delay.
- [ ] Data lifecycle prevents revoked/expired grants or disabled policies from resurrection; backup/restore clears/rebuilds derived cache safely.
- [ ] Expand/contract migrations, policy/evaluator model upgrades, cache namespace changes, event/API compatibility and rollbacks/roll-forward are tested.
- [ ] Unit, property, integration, contract, security, E2E, load, resilience, migration and smoke suites pass, including tenant escape, forged context, AST injection, stale-cache privilege retention and concurrent policy publication/revocation.
- [ ] Observability provides decision latency/allow-deny/error/cache/model-version/consumer/job metrics, traces/logs with redaction, dashboards/SLOs/alerts/runbooks.
- [ ] Deployment supports API/consumer/worker/scheduler independent scaling, graceful drain, canary, rollback/roll-forward, RPO/RTO restore and incident recovery.
- [ ] No undocumented permission, route, event, consumer, worker, schedule, notification, realtime channel, setting or dependency exists.

Final rule: any known path that can produce a false allow, cross-tenant access, stale privilege, uncontrolled policy execution, unaudited privileged mutation or hidden production runtime blocks release.