/**
 * @file admin.preset.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Admin preset for internal dashboard and debugging.
 *   Full output including debug information, SQL metrics, and stack traces.
 */

import type { IResponsePreset } from './preset.interface';

// ============================================================================
// Preset
// ============================================================================

/**
 * Admin preset.
 *
 * Suitable for internal admin dashboards and developer tools.
 * Includes all available information: debug, timing, SQL count,
 * memory usage, links, meta, and tracing.
 */
export const ADMIN_PRESET: IResponsePreset = {
  name: 'admin',
  includeDebug: true,
  includeLinks: true,
  includeMeta: true,
  includeTracing: true,
  stripNulls: false,
  flattenSingleItem: false,
  hints: {
    includeSqlCount: true,
    includeMemoryUsage: true,
    includeStackTrace: true,
  },
};
