-- =============================================================================
-- @file workers/registry/database/migrations/0002_application_versions.sql
-- @description Creates application version and manifest history.
--
-- @purpose Stores immutable, hash-addressed application manifests.
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

CREATE TABLE IF NOT EXISTS application_versions (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  UNIQUE(application_id, version)
);

CREATE INDEX IF NOT EXISTS idx_application_versions_app
  ON application_versions(application_id);
