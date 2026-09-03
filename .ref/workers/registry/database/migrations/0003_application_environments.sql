-- =============================================================================
-- @file workers/registry/database/migrations/0003_application_environments.sql
-- @description Creates per-application environment metadata.
--
-- @purpose Maps an application to its development, staging, and production deployment targets.
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

CREATE TABLE IF NOT EXISTS application_environments (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  deployment_url TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(application_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_application_environments_app
  ON application_environments(application_id, environment);
