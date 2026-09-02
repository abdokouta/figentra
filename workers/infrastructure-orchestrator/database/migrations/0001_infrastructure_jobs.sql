-- =============================================================================
-- @file workers/infrastructure-orchestrator/database/migrations/0001_infrastructure_jobs.sql
-- @description Creates durable infrastructure orchestration job state.
--
-- @purpose Stores intent, approval, execution status, and bounded command output; it never stores secrets.
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

CREATE TABLE IF NOT EXISTS infrastructure_jobs (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  operation TEXT NOT NULL,
  revision TEXT NOT NULL,
  workspace TEXT NOT NULL,
  reason TEXT NOT NULL,
  approval_ref TEXT,
  actor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  exit_code INTEGER,
  stdout TEXT,
  stderr TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_jobs_status
  ON infrastructure_jobs(status);

CREATE INDEX IF NOT EXISTS idx_infrastructure_jobs_created
  ON infrastructure_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_infrastructure_jobs_environment_status
  ON infrastructure_jobs(environment, status);

CREATE INDEX IF NOT EXISTS idx_infrastructure_jobs_actor ON infrastructure_jobs(actor_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_jobs_environment_updated ON infrastructure_jobs(environment, updated_at);
