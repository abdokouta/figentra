-- =============================================================================
-- @file workers/registry/database/schema.sql
-- @description Generated reference snapshot of the authoritative Registry D1 schema.
--
-- @source-of-truth Executable migrations under database/migrations/. This file
-- is a human-readable snapshot and MUST NOT be applied as a migration.
-- =============================================================================

-- =============================================================================
-- @file workers/registry/migrations/0001_registry.sql
-- @description Initial authoritative schema for the Figentra Application
-- Registry control-plane Worker.
--
-- @source-of-truth This schema is owned by the Registry Worker and is applied
-- with Wrangler D1 migrations. Terraform provisions the database; migrations
-- provision its logical schema.
--
-- @security The registry stores deployment metadata and routing policy, not
-- application business data or secrets. Secrets, OAuth credentials, and private
-- keys must never be persisted in these tables.
--
-- @operations Every externally meaningful mutation is represented by an audit
-- record. Versioned manifests are immutable once registered.
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

CREATE TABLE IF NOT EXISTS application_versions (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  UNIQUE(application_id, version)
);

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

CREATE TABLE IF NOT EXISTS application_capabilities (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_modules (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_resources (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES application_versions(id) ON DELETE CASCADE,
  module_key TEXT,
  resource_key TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  registration_key TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  application_id TEXT,
  actor_id TEXT,
  correlation_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_versions_app ON application_versions(application_id);
CREATE INDEX IF NOT EXISTS idx_routes_lookup ON application_routes(method, path_pattern);
CREATE INDEX IF NOT EXISTS idx_capabilities_app ON application_capabilities(application_id);
CREATE INDEX IF NOT EXISTS idx_modules_app ON application_modules(application_id);
CREATE INDEX IF NOT EXISTS idx_resources_app ON application_resources(application_id);
CREATE INDEX IF NOT EXISTS idx_actions_app ON application_actions(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);


-- =============================================================================
-- @file workers/registry/migrations/0002_route_audience.sql
-- @description Adds route metadata indexes required for deterministic Gateway
-- resolution and fast permission-aware route lookup.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_routes_method_permission
  ON application_routes(method, required_permission);

-- 0012_application_catalog_items.sql
CREATE TABLE IF NOT EXISTS application_catalog_items (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES application_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('event','workflow','integration','setting','feature','widget','localization')),
  item_key TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(version_id, category, item_key)
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_current_lookup ON application_catalog_items(application_id, category, item_key);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON application_catalog_items(category, item_key);
