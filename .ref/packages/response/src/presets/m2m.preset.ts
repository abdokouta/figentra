/**
 * @file m2m.preset.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Machine-to-machine preset for internal microservice communication.
 *   Full envelope with trace propagation but no debug overhead.
 */

import type { IResponsePreset } from './preset.interface';

// ============================================================================
// Preset
// ============================================================================

/**
 * Machine-to-machine preset.
 *
 * Optimized for internal service-to-service communication. Includes
 * full tracing for distributed observability, all meta for pagination
 * forwarding, but excludes debug to minimize overhead.
 */
export const M2M_PRESET: IResponsePreset = {
  name: 'm2m',
  includeDebug: false,
  includeLinks: true,
  includeMeta: true,
  includeTracing: true,
  stripNulls: true,
  flattenSingleItem: false,
  hints: {
    propagateTraceHeaders: true,
    includeServiceOrigin: true,
  },
};
