---
status: canonical
document: service-definition-of-done
service: identity
version: v1
---
# Identity Service — Production Definition of Done

Identity is complete only when every item below is implemented, reviewed, tested and observable in production-like staging. Documentation alone does not satisfy the gate.

## Architecture and source
- [ ] Ownership/non-goals match `01-architecture.md`.
- [ ] Exact source tree/modules/handlers/adapters match `02-implementation.md`.
- [ ] No unresolved TODO/FIXME/placeholder/fake production provider/target shim.
- [ ] Supabase is the sole production auth provider and is isolated behind the Identity-owned port.
- [ ] No Clerk organization/permission dependency and no authorization source outside IAM.

## API/domain/data
- [ ] Every controller/route/request/response/error/auth rule in `03-api.md` exists and OpenAPI contract passes.
- [ ] Every entity/value object/invariant/application workflow has unit and integration coverage.
- [ ] Every table/index/constraint/transaction/read model in `04-data-model.md` is migrated and query-plan verified.
- [ ] Idempotency, optimistic concurrency/versioning and transaction boundaries are implemented where specified.

## Events, queues, consumers, workers
- [ ] Every event in `05-events.md` and `11-messaging.md` has a versioned `@stackra/contracts` schema.
- [ ] Transactional outbox is used for every state+event mutation.
- [ ] Every stream, subject, durable consumer, queue group and DLQ is provisioned by IaC and Registry-projected.
- [ ] Duplicate/redelivery/crash-after-commit/replay/DLQ tests pass.
- [ ] Every worker/job/schedule in `06-jobs-and-scheduling.md` and `20-runtime-manifest.md` exists, is idempotent, bounded, observable and gracefully drainable.

## Communications and realtime
- [ ] Every email/in-app/operational notification request in `12-notifications-and-realtime.md` exists with template variables, locale, branding, dedupe, priority and security classification.
- [ ] No direct provider delivery SDK is used by Identity.
- [ ] Every realtime channel/event has authentication, IAM subscription authorization, reconnect recovery and out-of-order handling tests.

## NestJS runtime
- [ ] Every middleware, guard, interceptor, pipe, exception filter, observer/listener and controller in `13-runtime-and-framework.md` exists with ordering tests.
- [ ] API/consumer/worker/scheduler roles bootstrap independently from one source tree.
- [ ] SIGTERM/SIGINT drain and readiness transition are tested.
- [ ] No hidden ORM/network side effects or undocumented runtime artifacts exist.

## Configuration and Registry
- [ ] Every setting is typed, validated and classified secret/non-secret.
- [ ] Production refuses unsafe/missing security configuration.
- [ ] Registry projection includes routes, capabilities, permissions, events, queues, consumers, jobs, schedules, notifications, realtime, settings, health and dependencies.
- [ ] Registry outage does not block startup and exposes retry/degraded telemetry.
- [ ] Registry never receives secret values or domain state.

## Security
- [ ] JWT issuer/audience/signature/algorithm/expiry/skew validation tested.
- [ ] Provider webhook authenticity/replay protection tested.
- [ ] Session replay/family revocation, service credential rotation and delegation controls tested.
- [ ] Tenant isolation, forged principal/context, privilege escalation, injection, brute force and rate-limit tests pass.
- [ ] Sensitive values absent from logs/traces/metrics/events/errors/Registry.

## Dependencies/resilience
- [ ] Dependency graph has no cycles/forbidden service implementation imports.
- [ ] Every external call has timeout, retry eligibility and failure behavior.
- [ ] Redis/NATS/provider/IAM/Tenant/Registry/OTel failure tests match `17-resilience-and-failure.md`.
- [ ] Recovery and reconciliation restore correctness after missed events/outages.

## Testing and quality
- [ ] Unit, property, integration, contract, security, E2E, load, resilience, migration, smoke and deployment verification suites pass.
- [ ] Coverage thresholds are enforced with critical security/domain paths at effectively complete branch coverage.
- [ ] Race/concurrency tests cover linking, refresh/revoke, webhook duplicates and administrative mutations.
- [ ] Load targets and p95/p99 SLOs pass under production-shaped traffic.

## Deployment/data lifecycle
- [ ] Expand/contract migrations and mixed-version rollout pass.
- [ ] Backup/restore/provider reconciliation drill passes RPO/RTO.
- [ ] Retention, purge, erasure, archive and legal-hold interactions are verified.
- [ ] Canary, rollback and roll-forward procedures are executable.
- [ ] Runbooks and alerts have been exercised.

## Final gate
There is **zero deferred production architecture**: no future-only security control, no placeholder queue/worker, no undocumented email/notification, no missing consumer, no implicit schedule, no unregistered capability, no magic setting, no fake adapter and no known production-critical behavior left for a later redesign.