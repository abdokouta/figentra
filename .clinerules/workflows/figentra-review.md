# Figentra Enterprise Review Workflow

Review changes as a production gate, not as a style pass.

## Architecture
- One owner per domain.
- No forbidden module-to-module infrastructure imports.
- No accidental service/package creation.
- API/worker/scheduler are runtime roles.
- Registry remains metadata/control-plane only.

## Security
- Authentication, authorization, tenancy, and commercial entitlement remain distinct.
- No client-controlled security headers are trusted.
- Secrets are absent from code, manifests, logs, images, and metadata.
- External webhook/provider verification and egress controls remain service-side.

## Data and async
- No cross-owner database writes or foreign keys.
- Transactions and outbox semantics are correct.
- Consumers are idempotent.
- Retry, timeout, backoff, poison-message and DLQ behavior are explicit.
- Scheduled jobs are safe under duplicate execution.

## Operability
- Health/readiness are correct.
- Structured logs, metrics, traces and correlation IDs exist.
- Audit/tracking/analytics/usage semantics are not conflated.
- Configuration and secrets are production-safe.

## Verification
- Typecheck and lint pass.
- Relevant unit/integration/contract/e2e/security/load tests pass.
- Migrations are reviewed for compatibility and rollback strategy.
- Documentation and implementation plans match reality.
- No placeholder providers, fake production drivers, target shims, or deferred architecture remain.

Return findings by severity: BLOCKER, HIGH, MEDIUM, LOW. A BLOCKER or HIGH finding means the change is not production-ready.
