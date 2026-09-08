# Location Service — Observability

## Logs

Structured JSON logs with `requestId`, `traceId`, `tenantId` where policy permits, `service`, `operation`, `provider`, latency and outcome. Never log provider secrets, access tokens or raw sensitive location payloads unnecessarily.

## Metrics

- request count/error/latency by operation
- provider latency/error/fallback rate
- provider quota and spend counters
- geofence evaluation latency
- telemetry accepted/rejected/duplicate/late counts
- current-position update lag
- queue depth/consumer lag
- outbox age and failures
- database pool saturation

## Tracing

Trace HTTP → application service → provider/database → NATS publication where possible. Sample high-volume telemetry more aggressively than low-volume administrative operations.

## Health

Liveness must be dependency-free. Readiness checks required dependencies such as database/NATS according to deployment role.

## Alerts

Alert on sustained 5xx, provider exhaustion, elevated fallback, ingestion lag, outbox backlog, database saturation and abnormal cost/volume.
