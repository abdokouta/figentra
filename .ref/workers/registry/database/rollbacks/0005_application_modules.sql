-- =============================================================================
-- @file workers/registry/database/rollbacks/0005_application_modules.sql
-- @description Explicit rollback companion for 0005_application_modules.sql.
--
-- @operations
--   This file is NOT executed by Wrangler's forward migration runner.
--   It is an operator-reviewed rollback/restore aid and must only be used
--   during an approved change procedure after dependency analysis.
-- =============================================================================

DROP TABLE IF EXISTS application_modules;
