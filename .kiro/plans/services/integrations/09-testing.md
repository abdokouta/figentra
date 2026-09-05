# Integrations Service — Testing Contract

Unit-test provider contracts, request signing, mapping AST, checkpoint logic, retry classification, idempotency and reconciliation rules.

Integration-test PostgreSQL transactions, outbox, NATS, secret-manager references, HTTP clients, webhook verification and provider adapters using deterministic fixtures.

Contract-test provider capability interfaces, OpenAPI, webhook normalized events and `@stackra/contracts` versions.

Security-test SSRF/DNS rebinding/redirects, credential leakage, webhook forgery/replay, malicious mappings, tenant escape, unauthorized connection access and provider impersonation.

E2E: register integration → create connection → authorize → test → sync → receive webhook → reconcile discrepancy → rotate/revoke credentials.

Reliability: provider timeout/5xx/429, network failure, duplicate webhook, duplicate sync, ambiguous external mutation, NATS outage, DB failure, worker crash, checkpoint resume and DLQ recovery.

Load: webhook bursts, concurrent syncs, provider rate limits and large bounded datasets; verify p95/p99 and backpressure.

Migration/recovery tests cover rolling compatibility and database restore.