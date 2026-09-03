/**
 * @file webhook.preset.ts
 * @module @stackra/nestjs-response/core/presets
 * @description Webhook preset for outbound webhook deliveries.
 *   Flat payload with no envelope wrapping — just the raw event data.
 */

import type { IResponsePreset } from './preset.interface';

// ============================================================================
// Preset
// ============================================================================

/**
 * Webhook preset.
 *
 * For outbound webhook deliveries to third-party apps. No envelope
 * wrapping — delivers raw event payload. No links, no meta, no
 * tracing (the webhook system handles delivery tracking separately).
 */
export const WEBHOOK_PRESET: IResponsePreset = {
  name: 'webhook',
  includeDebug: false,
  includeLinks: false,
  includeMeta: false,
  includeTracing: false,
  stripNulls: true,
  flattenSingleItem: true,
  hints: {
    skipEnvelope: true,
  },
};
