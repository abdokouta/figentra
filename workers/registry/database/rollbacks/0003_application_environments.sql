-- =============================================================================
-- @file workers/registry/database/rollbacks/0003_application_environments.sql
-- @description Explicit rollback companion for 0003_application_environments.sql.
--
-- @operations
--   This file is NOT executed by Wrangler's forward migration runner.
--   It is an operator-reviewed rollback/restore aid and must only be used
--   during an approved change procedure after dependency analysis.
-- =============================================================================

DROP TABLE IF EXISTS application_environments;
