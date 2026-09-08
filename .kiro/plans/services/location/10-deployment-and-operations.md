# Location Service — Deployment and Operations

## Deployment

The service is a standalone deployable under `services/location`. Runtime configuration is injected through Doppler. `cloud.yaml` is metadata only.

Required operational resources: Node 24 runtime, PostgreSQL/PostGIS, NATS JetStream, provider credentials, metrics/logging/tracing and secret injection.

## Scaling

API replicas scale on request latency/CPU. Tracking consumers scale on stream lag. Provider calls are protected by per-provider concurrency/rate limits.

## Rollout

1. Run migrations forward-only.
2. Deploy application compatible with old schema.
3. Enable new behavior behind configuration when necessary.
4. Observe error/fallback/latency/cost metrics.
5. Remove compatibility code only after the contract window.

## Recovery

Provider outage: fallback or return stable retryable error. NATS outage: keep durable outbox and retry. Database outage: fail readiness and reject writes rather than claiming success. Corrupt telemetry: quarantine the batch and retain an auditable rejection reason.

## Backups

Database backups and restore testing are owned by the database infrastructure boundary. Tracking retention and backup policy must balance privacy and recovery requirements.
