# Messaging Infrastructure — NATS, JetStream, Redis and Kafka

**Status:** Canonical implementation plan
**Decision:** NATS + JetStream is the default; Redis is support infrastructure; Kafka requires ADR.

## Scope

Implement the platform messaging topology, client configuration, streams, consumers, retry/DLQ policy, observability, security, environment isolation and infrastructure automation.

## NATS / JetStream

- NATS cluster is provisioned per environment.
- JetStream is enabled for durable streams.
- Node/NestJS clients use `@nats-io/transport-node`.
- Streams and consumers are declared through deterministic infrastructure/configuration, not ad hoc application startup mutation.
- Subjects are versioned and owned by bounded contexts.
- Durable consumers use explicit ack, max deliveries, backoff and terminal failure handling.
- TLS and authenticated service identities are mandatory outside local development.
- Credentials are injected from secret management.

## Redis

Use Redis for cache, rate limits, short-lived coordination and bounded distributed locks. Persistence is selected only where required by the particular support workload. Redis is never the source of truth for business events.

## Kafka

No Kafka deployment is created in the default platform. A future Kafka requirement must first be accepted through ADR and then receive its own Terraform/Docker/operations plan.

## Environment topology

```text
development  → isolated NATS/JetStream + Redis
staging      → isolated NATS/JetStream + Redis
production   → isolated HA NATS/JetStream + Redis
```

## Operational requirements

- resource limits and connection limits;
- TLS/certificate rotation;
- backup/restore for JetStream persistent state where required;
- retention policies per stream;
- monitoring for connection errors, publish failures, consumer lag, redeliveries, DLQ volume and stream storage;
- alerts for sustained consumer lag and terminal failures;
- graceful drain on deployment;
- capacity testing before production scale;
- disaster-recovery procedure and restore test.

## Implementation files

The implementation must live under the canonical infrastructure/package/service boundaries:

- `packages/base/nats` — transport abstraction and adapters;
- `packages/base/contracts` — event/command contracts;
- `packages/base/database` + `packages/base/orm` — transactional persistence;
- `packages/capabilities/events` — business event utilities;
- `infrastructure/terraform` — NATS/Redis/cloud resources and environment state;
- `infrastructure/docker` — reproducible local/CI images where containerized infrastructure is used;
- owning service modules — outbox records, relays and consumers.

## Exit criteria

- All durable service events use outbox → JetStream.
- No durable business flow depends on Redis Pub/Sub.
- No service adds Kafka without ADR approval.
- Every consumer is idempotent and observable.
- Development/staging/production are isolated.
- Failure, retry, replay and restore tests pass.
