-- =============================================================================
-- @file workers/infrastructure-orchestrator/database/rollbacks/0001_infrastructure_jobs.sql
-- @description Explicit rollback companion for the Infrastructure Orchestrator
--   job-state migration.
--
-- @operations This file is not executed by Wrangler's forward migration runner.
-- =============================================================================

DROP TABLE IF EXISTS infrastructure_jobs;
