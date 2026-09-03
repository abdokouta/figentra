# Final Implementation Readiness Checklist

**Status:** Normative

Use this checklist for every package, service, application module and Worker before implementation is considered complete.

## Package

- [ ] Owner and boundary are explicit.
- [ ] Exact directory and source tree are defined.
- [ ] Every public export and method is defined.
- [ ] Root/subpath dependency boundaries are defined.
- [ ] Provider/adapter matrix is complete.
- [ ] Runtime/framework/testing subpaths are defined.
- [ ] Configuration schema and secret references are defined.
- [ ] Lifecycle/DI/discovery/registry behavior is defined.
- [ ] Security and tenancy rules are defined.
- [ ] Errors/retries/cancellation/timeouts are defined.
- [ ] Concurrency/resource limits are defined.
- [ ] Logging/metrics/tracing are defined.
- [ ] Persistence/migration is defined where applicable.
- [ ] Real-provider conformance tests are defined where applicable.
- [ ] Versioning/compatibility/rollback is defined.

## Service

- [ ] Bounded-context ownership is explicit.
- [ ] Every module has an exact source path.
- [ ] Commands/queries/handlers are enumerated.
- [ ] Controllers/routes/DTOs/validation are enumerated.
- [ ] Repositories/ports/adapters are enumerated.
- [ ] Tables/indexes/migrations are enumerated.
- [ ] Published and consumed events are enumerated.
- [ ] Queue subjects/jobs/handlers/DLQ are enumerated.
- [ ] Scheduler entries are enumerated.
- [ ] Email/notification/Slack effects are enumerated or explicitly N/A.
- [ ] Webhooks/integrations are enumerated or explicitly N/A.
- [ ] Idempotency/reconciliation is defined.
- [ ] Tenant/IAM authorization is defined.
- [ ] Health/readiness/shutdown is defined.
- [ ] Observability/audit is defined.
- [ ] Unit/integration/contract/E2E/load/security tests are defined.
- [ ] Deployment/rollback is defined.

## Frontend/mobile

- [ ] Typed HTTP contract is defined.
- [ ] Authentication/session propagation is defined.
- [ ] Scope/tenant context propagation is defined.
- [ ] Query/cache keys are tenant-safe.
- [ ] Loading/error/empty/offline states are defined.
- [ ] Cancellation/retry behavior is defined.
- [ ] React and React Native boundaries are explicit.
- [ ] Provider SDKs are excluded from client bundles unless intentionally required.
- [ ] Accessibility and localization behavior is defined.

## Cross-service

- [ ] Only `@stackra/contracts` crosses implementation boundaries.
- [ ] No cross-service database writes exist.
- [ ] Transactional outbox is defined for durable events.
- [ ] NATS subject/version conventions are defined.
- [ ] HTTP/OpenAPI contract is versioned.
- [ ] Correlation and trace propagation is defined.
- [ ] Failure/replay/reconciliation is defined.

## Final gate

A checked plan must be executable by an engineer without making architecture decisions that belong in the specification. If implementation discovers an undefined boundary, stop and update the canonical plan/ADR before coding.
