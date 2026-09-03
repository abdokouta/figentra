/**
 * @file api.preset.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Standard API preset for public-facing REST and GraphQL consumers.
 *   Balanced output with links, meta, and tracing but no debug information.
 */

import type { IResponsePreset } from './preset.interface';

// ============================================================================
// Preset
// ============================================================================

/**
 * Standard API preset.
 *
 * Suitable for public API consumers (web frontends, third-party integrations).
 * Includes links, meta, and tracing but excludes debug information.
 */
export const API_PRESET: IResponsePreset = {
  name: 'api',
  includeDebug: false,
  includeLinks: true,
  includeMeta: true,
  includeTracing: true,
  stripNulls: false,
  flattenSingleItem: false,
};
