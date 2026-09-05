---
status: canonical
document: service-definition-of-done
service: audit
version: v1
---
# Audit Service — Production Definition of Done

Audit is production-ready only when every gate is implemented and proven.

- [ ] Architecture/source/module boundaries match `01`/`02`; Audit is governance evidence, not logs/analytics/authz.
- [ ] Every query/export/integrity/retention/legal-hold route/DTO/error/auth rule in `03` exists with bounded filters/ranges.
- [ ] Every table/index/constraint/chain-head/outbox schema in `04` is migrated and query-plan/concurrency tested.
- [ ] AuditRecord is append-only; duplicate source events cannot create duplicate evidence; concurrent append preserves partition sequence/hash continuity.
- [ ] Every accepted source event and Audit event/subject/consumer/DLQ in `05`/`11` has versioned schema, classification validation, inbox/outbox, retry/quarantine/replay tests and IaC.
- [ ] Every export/integrity/archive/delete/quarantine worker and schedule is idempotent, bounded, checkpointed/locked where required, observable and drainable.
- [ ] Every governance/operational notification and realtime status channel in `12` is implemented without raw restricted-record leakage.
- [ ] Every middleware/guard/interceptor/pipe/filter/observer/controller in `13` exists with ordering/bootstrap/shutdown tests.
- [ ] Configuration is typed and production-safe; hash/canonicalization, retention, legal hold, query/export and encryption limits cannot be unbounded/unsafe.
- [ ] Registry projection includes accepted source schemas, routes, permissions, events, consumers, workers, schedules, notifications, realtime, chain/archive versions, settings, health and dependencies; no record payload/secrets.
- [ ] Dependency graph has no source-service implementation/database import and no synchronous source-service truth dependency.
- [ ] DB/NATS/object-storage/IAM failures never produce false committed/completed states.
- [ ] Legal holds always override deletion; deletion rechecks eligibility immediately before destructive action.
- [ ] Archive artifact checksum/manifest/hash continuity is verified before hot deletion; restore verifies chain integrity before readiness.
- [ ] Hash/canonicalization/schema/event/archive upgrades preserve historical verification; no in-place silent rehash.
- [ ] Unit, property, integration, contract, security, E2E, load, resilience, migration, corruption/tamper and restore suites pass.
- [ ] Security tests cover cross-tenant query/export, forged service ingestion, query abuse, export leakage, unauthorized hold/retention mutation, quarantine replay and signed-reference expiry.
- [ ] Observability covers ingestion lag/reject/quarantine, append latency, chain conflicts, export/integrity/archive/delete outcomes, hold/retention state, storage health, SLOs/alerts/runbooks.
- [ ] API/consumer/worker/scheduler scale independently, gracefully drain and meet canary/rollback/roll-forward/RPO/RTO requirements.
- [ ] No undocumented auditable subject, queue, consumer, worker, schedule, notification, realtime channel, setting, permission, capability, archive format or dependency exists.

Any known path to mutable evidence, silent tamper repair, deletion under hold, unauthenticated export, false integrity success, hidden ingestion subject or unverifiable restore blocks release.