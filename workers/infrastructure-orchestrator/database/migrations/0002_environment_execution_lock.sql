-- Prevent concurrent queued/running mutations in the same environment.
CREATE UNIQUE INDEX IF NOT EXISTS uq_infrastructure_active_environment
  ON infrastructure_jobs(environment)
  WHERE status IN ('queued', 'running');
