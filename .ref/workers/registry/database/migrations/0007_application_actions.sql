-- =============================================================================
-- @file workers/registry/database/migrations/0007_application_actions.sql
-- @description Creates application action and permission metadata.
--
-- @purpose Stores action-level authorization metadata exposed by registered applications.
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

CREATE TABLE IF NOT EXISTS application_actions (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  resource_key TEXT,
  action_key TEXT NOT NULL,
  permission TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_app
  ON application_actions(application_id);
