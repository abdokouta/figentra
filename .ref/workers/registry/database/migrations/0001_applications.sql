-- =============================================================================
-- @file workers/registry/database/migrations/0001_applications.sql
-- @description Creates the authoritative application identity table.
--
-- @purpose Stores immutable application identity plus mutable presentation/status metadata.
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

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_version TEXT,
  branding_json TEXT NOT NULL DEFAULT '{}',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
