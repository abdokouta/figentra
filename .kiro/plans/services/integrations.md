---
status: canonical
component: service
name: integrations
---
# Integrations Service — implementation plan

Own external-system connections, credentials/references, webhook ingestion, synchronization orchestration and provider lifecycle. Business semantics remain in owning services.

## Modules
`connection`, `credential-reference`, `provider`, `webhook`, `sync`, `mapping`, `reconciliation`, `persistence`, `http`, `messaging`.

## Runtime
NestJS `api` for connection management; `consumer` for integration events; `worker` for sync/reconciliation; `scheduler` for polling where webhooks are unavailable.

## Contracts
Provider-neutral versioned integration contracts in `@stackra/contracts`; external SDK/webhook schemas are adapter-local and verified at ingress.

## Reliability/security
Idempotent webhook delivery, signature verification, replay protection, bounded retries/DLQ, rate-limit backoff and reconciliation. Credentials live in a secret manager; DB stores references, not raw secrets. Tenant-scoped connections and egress allowlists are mandatory.

## Observability/testing/deployment
Trace outbound calls and sync jobs without secrets/PII; metrics for latency, rate limits, failures, backlog and drift. Contract/provider sandbox tests, replay/concurrency/isolation/migration tests. Docker + Terraform with health-gated rollout and graceful shutdown.

## Exit criteria
Provider adapters are real, versioned and tested; webhook/sync/reconciliation paths are durable and safe; no generic provider stub remains.
