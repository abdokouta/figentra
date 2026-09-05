# Integrations Service — Data Model

PostgreSQL is authoritative; external systems remain authoritative for their own records.

`integrations(id,key,name,provider_key,status,capabilities,version,timestamps)` unique provider key.

`connections(id,tenant_id,integration_id,external_account_ref,status,scopes,credential_ref_id,last_sync_at,version,timestamps)` indexed tenant/integration/status; external account reference unique per provider/tenant.

`credential_refs(id,connection_id,secret_reference,status,created_at,rotated_at,expires_at)` contains no secret values.

`webhook_events(id,provider,connection_id,external_event_id,event_type,received_at,verified_at,processed_at,status,payload_hash)` unique provider/connection/external event ID.

`sync_jobs(id,tenant_id,connection_id,type,status,cursor,checkpoint,attempts,started_at,completed_at,last_error,version)`.

`mappings(id,tenant_id,connection_id,entity_type,version,status,definition)` validated typed mapping definition.

`reconciliation_jobs(id,tenant_id,connection_id,entity_type,status,cursor,discrepancy_count,checkpoint,timestamps)`.

`outbox(...)` canonical transactional outbox.

## Invariants
Connection belongs to exactly one tenant/integration. Credential refs are external secrets. Mapping is bounded typed data, never executable code. Sync/reconciliation checkpoints are monotonic and resumable. Webhook external event IDs are deduplicated.

## Transactions
Local state changes and outgoing domain events use outbox. External mutations use provider idempotency keys when available and explicit ambiguity handling when not.

## Indexes/retention
Hot paths: tenant connection status, webhook dedup, sync status/checkpoint, reconciliation status. Webhook payload storage is minimized and retained only as needed for replay/evidence.

## Migrations
Expand/contract rolling migrations with compatibility tests. Never delete provider state merely because local reconciliation temporarily fails.