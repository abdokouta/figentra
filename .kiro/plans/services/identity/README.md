# Identity Service Plan

Canonical production plan set for the Identity authentication service.

- `01-architecture.md` — ownership, trust model and boundaries.
- `02-implementation.md` — implementation contract.
- `03-api.md` — HTTP/internal API.
- `04-data-model.md` — PostgreSQL ownership/schema.
- `05-events.md` — NATS/outbox contract.
- `06-jobs-and-scheduling.md` — workers/schedules.
- `07-security-and-authorization.md` — authentication security and IAM boundary.
- `08-observability.md` — logs/metrics/traces/SLOs.
- `09-testing.md` — verification strategy.
- `10-deployment-and-operations.md` — deployment/recovery/runbooks.
- `11-messaging-and-topics.md` — streams, subjects, consumers and DLQs.
- `12-notifications-and-realtime.md` — notification/realtime contracts.
- `13-runtime-and-framework.md` — NestJS runtime and cross-cutting pipeline.
- `14-configuration-and-registry.md` — typed configuration and Registry projection.
- `15-dependency-graph.md` — dependency/failure graph.
- `16-data-lifecycle.md` — retention and lifecycle.
- `17-resilience-and-failure.md` — failure/recovery behavior.
- `18-migrations-and-upgrades.md` — schema/version upgrades.
- `19-capabilities-permissions-and-settings.md` — capability/settings catalog.
- `20-runtime-manifest.md` — complete runtime inventory.
- `21-definition-of-done.md` — implementation acceptance gate.
- `22-gateway-boundary-and-redundancy.md` — canonical Gateway/service responsibility split.

## Gateway boundary
Gateway owns public edge routing, WAF/CORS, coarse edge rate limits, transport normalization and propagation. Identity retains authoritative authentication, session/replay/provider semantics, service-side trust validation, domain validation, idempotency and direct/internal-ingress security. IAM remains authorization authority. Registry is metadata projection only.

All documents form one implementation contract. No document may introduce a competing edge authority, mirrored worker application, service-to-service database access or deferred day-one architecture.