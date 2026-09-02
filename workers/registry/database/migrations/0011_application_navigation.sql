CREATE TABLE IF NOT EXISTS application_navigation (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  navigation_key TEXT NOT NULL,
  path TEXT NOT NULL,
  label TEXT,
  icon TEXT,
  required_permission TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(application_id, version_id, navigation_key)
);

CREATE INDEX IF NOT EXISTS idx_navigation_app ON application_navigation(application_id);
CREATE INDEX IF NOT EXISTS idx_navigation_permission ON application_navigation(required_permission);
