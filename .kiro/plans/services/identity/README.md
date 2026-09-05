# Identity Service Plan

Canonical service plan set for day-one production.

- `01-architecture.md` — ownership, boundaries and trust model.
- `02-implementation.md` — exact implementation contract.
- `03-api.md` — HTTP/internal API contract.
- `04-data-model.md` — PostgreSQL ownership and schema contract.
- `05-events.md` — NATS/outbox event contract.
- `06-jobs-and-scheduling.md` — background execution and schedules.
- `07-security-and-authorization.md` — security controls and IAM integration.
- `08-observability.md` — logs, metrics, traces, SLOs and alerts.
- `09-testing.md` — complete verification strategy.
- `10-deployment-and-operations.md` — deployment, recovery and runbooks.

All documents are mutually consistent and form one implementation contract; none defers required day-one architecture.