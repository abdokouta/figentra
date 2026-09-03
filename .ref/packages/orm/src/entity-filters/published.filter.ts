/**
 * @file published.filter.ts
 * @description Entity filter that only returns published records.
 * Applied on-demand to entities with @Publishable() trait.
 *
 * Behavior:
 * - Default: OFF — must be explicitly enabled
 * - Enable: { filters: { published: true } }
 * - Shows only records where publishedAt <= now
 */

export const PUBLISHED_FILTER_NAME = 'published';

export const publishedFilter = {
  name: PUBLISHED_FILTER_NAME,
  cond: () => ({ publishedAt: { $lte: new Date() } }),
  default: false,
};
