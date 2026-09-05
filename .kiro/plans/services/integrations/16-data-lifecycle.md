---
status: canonical
document: service-data-lifecycle
service: integrations
version: v1
---
# Integrations Service — Data Lifecycle Contract

Integration catalog definitions are versioned platform metadata. Tenant `Connection` state is authoritative in Integrations; external provider objects remain provider-owned and product business objects remain product-service-owned.

## Connection lifecycle
`draft/configuring -> authorizing -> active -> degraded|failed -> revoked|archived`. State transitions are explicit/versioned. Revocation immediately prevents new provider calls, invalidates authorization/credential references, cancels or safely stops eligible queued work and emits connection-revoked facts. Reactivation requires a new validated authorization transition; stale credentials are never silently reused.

## Credential lifecycle
Database stores only `CredentialRef` metadata, never secret values. Creation/rotation/revocation coordinates with the secret manager. Rotation uses versioned reference/overlap only where provider semantics require it; revoked references cannot be selected. Tenant deletion/archive revokes eligible provider credentials according to explicit provider cleanup policy.

## Webhook lifecycle
Inbound webhook receipt stores provider event ID where supplied, body digest, verified metadata, normalized event type, processing state, timestamps and bounded diagnostic metadata. Raw provider payload retention is minimized and, if required for a provider contract/debug window, encrypted with explicit TTL/classification. Signature-invalid payloads never become trusted normalized events.

## Sync lifecycle
`requested -> running -> completed|failed|cancelled`; checkpoints/cursors are versioned and tied to connection/provider/entity/direction/mapping version. A retry resumes from a safe checkpoint or restarts idempotently according to provider semantics. Old checkpoints expire after retention and cannot be reused against incompatible mapping/provider versions.

## Mapping/reconciliation
Mappings are versioned; published revisions are immutable and new edits create new versions. Reconciliation findings/results have bounded retention and references to connection/mapping/provider versions so later repair is reproducible.

## Tenant archive/erasure
Tenant lifecycle facts disable connections and start an idempotent cleanup workflow: stop syncs, revoke provider authorization where contract allows/requires, remove secret material, expire webhooks/checkpoints, delete/anonymize eligible Integrations-owned data after retention/legal checks and emit completion evidence. Integrations never deletes product business data directly.

## Backup/restore
Restore includes connections/non-secret credential refs, mappings, webhook dedupe state, sync/reconciliation state and outbox. Secret material is restored/reconciled from secret manager, not DB backup. Before readiness, restored active connections are credential/provider-health validated or marked degraded pending reconciliation; no unverified connection is assumed healthy.

## Tests
Test revoke during sync, credential rotation races, webhook duplicate/expiry, incompatible checkpoint/mapping, tenant cleanup partial failure/retry, secret-manager deletion, backup restore/reconciliation and prevention of revoked credential/connection resurrection.