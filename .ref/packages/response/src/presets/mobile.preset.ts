/**
 * @file mobile.preset.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Mobile preset for native app consumers.
 *   Minimal payload with no HATEOAS links and stripped nulls
 *   for bandwidth efficiency.
 */

import type { IResponsePreset } from './preset.interface';

// ============================================================================
// Preset
// ============================================================================

/**
 * Mobile preset.
 *
 * Optimized for mobile app consumers. Strips HATEOAS links (mobile apps
 * use their own routing), removes null values, and limits nesting depth
 * to reduce payload size.
 */
export const MOBILE_PRESET: IResponsePreset = {
  name: 'mobile',
  includeDebug: false,
  includeLinks: false,
  includeMeta: true,
  includeTracing: false,
  stripNulls: true,
  flattenSingleItem: true,
  maxDepth: 4,
};
