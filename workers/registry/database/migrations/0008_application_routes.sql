-- =============================================================================
-- @file workers/registry/database/migrations/0008_application_routes.sql
-- @description Creates application route metadata used by Gateway resolution.
--
-- @purpose Stores deterministic HTTP route-to-upstream mappings and authorization requirements.
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

CREATE TABLE IF NOT EXISTS application_routes (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path_pattern TEXT NOT NULL,
  upstream TEXT NOT NULL,
  audience TEXT NOT NULL,
  required_permission TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_lookup
  ON application_routes(method, path_pattern);

CREATE INDEX IF NOT EXISTS idx_routes_method_permission
  ON application_routes(method, required_permission);
