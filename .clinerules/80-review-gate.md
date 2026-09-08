# Cline Rule: Review Gate

Before declaring a task complete, verify:

## Architecture
- [ ] The change has one clear owner.
- [ ] No unnecessary service/package/runtime boundary was introduced.
- [ ] Module dependencies respect the architecture.
- [ ] Existing canonical packages/contracts were reused.

## Security
- [ ] Authentication and authorization responsibilities remain separated.
- [ ] Tenant isolation is enforced.
- [ ] No client-supplied security headers are trusted.
- [ ] Secrets are externalized and redacted.

## Data
- [ ] The owner controls its persistence.
- [ ] No cross-owner database write exists.
- [ ] Transactions and outbox semantics are correct.
- [ ] Migrations and indexes are complete.

## Async
- [ ] Durable events use transactional outbox.
- [ ] Consumers are idempotent.
- [ ] Retries/backoff/DLQ are defined.
- [ ] Scheduler execution is deduplicated/leased where needed.
- [ ] Async context propagation is preserved.

## Observability
- [ ] Logs are structured and safe.
- [ ] Traces and metrics are emitted.
- [ ] Request/correlation/trace IDs propagate.
- [ ] Worker/scheduler operational metrics exist.
- [ ] Audit is not confused with logging/tracking/analytics.

## Gateway/Registry
- [ ] Gateway remains transport/edge authority only.
- [ ] Services remain authoritative for authn/authz/tenant/business rules.
- [ ] Registry contains metadata only and never business truth or secrets.
- [ ] Registry failure does not make normal service startup/business correctness dependent on it.

## Production
- [ ] Configuration is typed and validated.
- [ ] Health/readiness exists.
- [ ] Graceful shutdown exists.
- [ ] Failure and recovery paths are tested.
- [ ] CI passes.
- [ ] No TODO architecture, fake production driver, target shim, or deferred mandatory implementation remains.
