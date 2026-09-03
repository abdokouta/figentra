/**
 * @file not-expired.filter.ts
 * @description Entity filter that excludes expired records.
 * Applied on-demand to entities with @Expirable() trait.
 *
 * Behavior:
 * - Default: OFF — must be explicitly enabled
 * - Enable: { filters: { notExpired: true } }
 * - Shows only records where expiresAt is null OR expiresAt > now
 */

export const NOT_EXPIRED_FILTER_NAME = 'notExpired';

export const notExpiredFilter = {
  name: NOT_EXPIRED_FILTER_NAME,
  cond: () => ({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }),
  default: false,
};
