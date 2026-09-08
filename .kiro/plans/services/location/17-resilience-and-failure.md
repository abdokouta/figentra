# Location Service — Resilience and Failure

## Provider failure

Timeout/rate-limit/unavailable → record provider health, retry only when safe, select equivalent fallback, otherwise return retryable `LOCATION_PROVIDER_UNAVAILABLE`.

## Database failure

Writes fail closed. Readiness becomes unhealthy when the dependency is required for the role. Never acknowledge telemetry before durable acceptance.

## Broker failure

Business mutation remains committed with an outbox record. Publication resumes after broker recovery.

## Duplicate/out-of-order telemetry

Duplicates are acknowledged idempotently. Late points are retained according to policy but cannot move current position backwards unless the configured correction policy permits it.

## Bad geometry

Validate and normalize geometry before persistence. Reject invalid self-intersecting or unsupported geometry with a stable validation error.

## Cost protection

Provider requests have quotas, concurrency limits, cache policies and optional tenant budgets. A provider may be healthy but temporarily unavailable to a tenant because of quota policy.
