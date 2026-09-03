-- =============================================================================
-- @file workers/registry/database/migrations/0010_audit_log.sql
-- @description Creates the registry audit log.
--
-- @purpose Provides append-only operational traceability for externally meaningful registry mutations.
--
-- @architecture
--   This is a forward-only Cloudflare D1 migration. Wrangler owns migration
--   ordering and records applied migrations in its D1 migration metadata.
--
-- @security
--   Never store credentials, access tokens, API keys, private keys, or other
--   secrets in D1 application tables.
--
-- @operations
--   Rollback SQL is maintained under the sibling database/rollbacks directory.
--   Do NOT place DROP statements in a Wrangler-applied migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  application_id TEXT,
  actor_id TEXT,
  correlation_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created
  ON audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_correlation
  ON audit_log(correlation_id);
