-- =============================================================================
-- @file workers/registry/database/migrations/0012_application_catalog_items.sql
-- @description First-class versioned metadata for Registry categories that are
--              not operational domain data.
--
-- @purpose Keeps the Registry complete without proliferating one-off tables for
--          every metadata category. The category is constrained by CHECK and
--          the payload remains immutable with the application version.
--
-- @security Never store secrets, credentials, tokens, private keys, or secret
--           values in catalog payloads. `sensitive` settings describe metadata;
--           actual values belong to the owning configuration/secret service.
-- =============================================================================

CREATE TABLE IF NOT EXISTS application_catalog_items (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES application_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN (
      'event',
      'workflow',
      'integration',
      'setting',
      'feature',
      'widget',
      'localization'
    )
  ),
  item_key TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(version_id, category, item_key)
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_current_lookup
  ON application_catalog_items(application_id, category, item_key);

CREATE INDEX IF NOT EXISTS idx_catalog_items_category
  ON application_catalog_items(category, item_key);
