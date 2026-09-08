# Location Service — Definition of Done

The service is considered implementation-complete only when:

- [ ] Standalone NestJS service builds and starts.
- [ ] Fastify HTTP runtime and NATS transport are configured.
- [ ] Configuration is validated and secrets are externalized.
- [ ] PostgreSQL/PostGIS migrations and spatial indexes exist.
- [ ] Tenant/IAM authorization is enforced on every domain operation.
- [ ] Provider abstraction and at least one production adapter pass contract tests.
- [ ] Geocoding, places, routing, geofencing and tracking contracts are implemented.
- [ ] Current state is separated from tracking history.
- [ ] Tracking ingestion is idempotent and handles late/out-of-order data.
- [ ] Outbox guarantees durable event publication.
- [ ] NATS consumers are idempotent with bounded retry/DLQ.
- [ ] Observability covers latency, errors, provider health, telemetry and backlog.
- [ ] Retention/deletion policies are implemented and tested.
- [ ] OpenAPI and internal event contracts are published.
- [ ] Unit, integration, contract, E2E and failure tests pass.
- [ ] Deployment manifest, health checks and operational runbook are complete.
- [ ] Load tests meet agreed SLOs without unbounded provider spend.

Until these gates pass, the service is a scaffold rather than a production location platform.
