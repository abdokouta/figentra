-- =============================================================================
-- Figentra transactional outbox baseline
-- =============================================================================
-- @description Every persistence-owning service applies this schema in its own
-- database/schema. The table is never shared across service boundaries.
--
-- @guarantee Business state and the outbox row MUST be committed in the same
-- transaction. Relay delivery is at-least-once; consumers deduplicate by id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  version TEXT NOT NULL,
  payload JSONB NOT NULL,
  producer TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
  ON outbox_events (created_at)
  WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_retry
  ON outbox_events (next_attempt_at)
  WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS outbox_dead_letters (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_version TEXT NOT NULL,
  payload JSONB NOT NULL,
  producer TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  attempts INTEGER NOT NULL,
  error TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
