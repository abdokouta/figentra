---
status: canonical
document: service-definition-of-done
service: integrations
version: v1
---
# Integrations Service — Production Definition of Done

Integrations is production-ready only when every gate is implemented and proven.

- [ ] Architecture/source/module boundaries match `01`/`02`; authentication providers remain Identity-owned and no Clerk/Supabase auth adapter exists here.
- [ ] Every catalog/connection/auth/webhook/sync/mapping/reconciliation/provider-status route/DTO/error/auth rule in `03` exists.
- [ ] Every table/index/constraint/checkpoint/outbox schema in `04` is migrated and concurrency/query-plan tested.
- [ ] Every provider adapter implements the declared capability/auth/config/webhook/sync/rate/idempotency/egress contract with sandbox/fixture contract tests.
- [ ] Every event/command/stream/subject/consumer/DLQ in `05`/`11` has versioned schemas, transactional outbox/inbox, duplicate/redelivery/crash/replay tests and IaC.
- [ ] Webhook raw-body verification, timestamp/replay protection, dedupe and asynchronous processing are implemented for every provider event route.
- [ ] Every worker/job/schedule is idempotent, bounded, checkpointed/locked as required, provider-rate-aware, observable and drainable.
- [ ] Every connection/sync/security notification and realtime channel in `12` is implemented with tenant/IAM authorization and no credential/raw-payload leakage.
- [ ] Every middleware/guard/interceptor/pipe/filter/observer/controller in `13` exists with ordering/bootstrap/shutdown tests.
- [ ] Configuration/provider schemas are typed/versioned/safety-bounded; secrets are secret-manager references; SSRF/redirect/egress policy is enforced.
- [ ] Registry projection includes routes, providers/capabilities, connection config schemas, webhook metadata, events, consumers, workers, schedules, notifications, realtime, settings, dependencies and health, with zero secret/tenant connection values.
- [ ] Compile/runtime dependency graph is acyclic; provider SDKs remain infrastructure-only; no other service implementation/database imports exist.
- [ ] DB/Redis/NATS/secret-manager/provider/IAM/Tenant failures match `17`; no provider mutation occurs without durable intent/reconciliation strategy.
- [ ] Revoked connections/credentials cannot be used by queued workers; workers revalidate connection version/state before external mutation.
- [ ] Data lifecycle handles credential rotation, webhook retention, sync checkpoints, mapping versions, tenant archive/erasure and backup/restore reconciliation.
- [ ] Provider/API/mapping/checkpoint/event/schema upgrades pass mixed-version/rollback/roll-forward verification; no silent reinterpretation of active connection config.
- [ ] Unit, integration, provider contract, webhook security, tenant isolation, E2E, load, resilience, migration and smoke suites pass, including 429/5xx/timeouts, duplicate/out-of-order webhooks, partial provider success and worker crash after provider success.
- [ ] Observability covers provider latency/errors/rate limit/circuit, webhook accepts/rejects, sync/reconciliation lag/progress/failure, consumers/DLQs, secret-manager health, SLOs, alerts and runbooks.
- [ ] API/consumer/worker/scheduler scale independently, gracefully drain and support canary/rollback/roll-forward/RPO/RTO procedures.
- [ ] No undocumented provider, external host, webhook, event, queue, consumer, worker, schedule, notification, realtime channel, setting, permission, capability or dependency exists.

Any known path to credential leakage, SSRF, forged webhook acceptance, cross-tenant connection access, duplicate unsafe provider mutation, hidden external dependency, untracked partial provider success or auth-provider ownership leakage blocks release.