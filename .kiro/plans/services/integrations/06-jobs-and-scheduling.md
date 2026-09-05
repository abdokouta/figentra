# Integrations Service — Jobs & Scheduling

`ProcessWebhookEvent` verifies/deduplicates/normalizes provider events.

`RunSyncJob` executes cursor-based synchronization with bounded pages, checkpoint commits and provider rate-limit handling.

`RunReconciliation` compares configured authoritative fields, records discrepancies and never silently overwrites local business data.

`RetryFailedRequest` handles only provider operations proven idempotent; ambiguous non-idempotent operations require reconciliation rather than blind retry.

`CredentialRotation` rotates configured credential references under explicit authorization.

Schedules: webhook processing continuously; connection health every fifteen minutes; configured sync schedules through Scheduler; reconciliation daily and after detected drift; credential-expiry checks hourly.

Each job has timeout, retry/backoff, idempotency, lease, checkpoint and DLQ. Per-tenant/provider concurrency and outbound rate limits are bounded.

Metrics: provider latency/error/rate-limit, sync lag, checkpoint age, webhook backlog, reconciliation discrepancies, retries and DLQ depth.