/**
 * @file soft-delete.filter.ts
 * @description Entity filter that excludes soft-deleted records by default.
 * Applied automatically to entities with @SoftDeletes() trait.
 *
 * Behavior:
 * - Default: ON — all queries exclude records where deletedAt is not null
 * - Disable per-query: { filters: { softDelete: false } }
 * - "withTrashed": { filters: { softDelete: false } }
 * - "onlyTrashed": { filters: { softDelete: false } } + manual { deletedAt: { $ne: null } }
 */

export const SOFT_DELETE_FILTER_NAME = 'softDelete';

export const softDeleteFilter = {
  name: SOFT_DELETE_FILTER_NAME,
  cond: { deletedAt: null },
  default: true,
};
