/**
 * @file not-archived.filter.ts
 * @description Entity filter that excludes archived records.
 * Applied automatically to entities with @Archivable() trait.
 *
 * Behavior:
 * - Default: ON — all queries exclude archived records
 * - Disable: { filters: { notArchived: false } }
 * - "withArchived": { filters: { notArchived: false } }
 */

export const NOT_ARCHIVED_FILTER_NAME = 'notArchived';

export const notArchivedFilter = {
  name: NOT_ARCHIVED_FILTER_NAME,
  cond: { archivedAt: null },
  default: true,
};
