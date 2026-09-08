# Location Service — Jobs and Scheduling

## Asynchronous jobs

- provider retry/backoff
- outbox publication
- tracking normalization
- geofence transition evaluation
- visit detection/finalization
- provider-cache expiry
- telemetry retention cleanup

## Scheduling

Schedulers are advisory: every job must be safe to retry and must use durable state/leases. No correctness decision may depend on an in-memory cron tick.

## Queues

NATS JetStream is the default internal broker. BullMQ may be introduced only for workloads that explicitly need Redis-backed delayed/repeated jobs; do not create two queue systems for the same workflow.

## Tracking processing

1. Validate and authenticate device batch.
2. Deduplicate.
3. Persist accepted points.
4. Update current position using ordering/accuracy policy.
5. Evaluate affected geofences.
6. Emit transitions through outbox.
7. Update visit state asynchronously.
