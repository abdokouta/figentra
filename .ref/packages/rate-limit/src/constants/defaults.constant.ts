/**
 * @file defaults.constant.ts
 * @module @stackra/nestjs-rate-limit/constants
 * @description Default configuration values for the rate limit module.
 *   Applied when `RateLimitModule.forRoot()` is called without explicit overrides.
 */

import type { IRateLimitConfig } from '../interfaces';

// ============================================================================
// Defaults
// ============================================================================

/**
 * Default rate limit module configuration.
 *
 * Uses the memory backend by default (safe for development and tests).
 * Switch to 'redis' for production multi-instance deployments.
 */
export const RATE_LIMIT_DEFAULTS: IRateLimitConfig = {
  // ── Backend ───────────────────────────────────────────────────────────
  backend: 'memory',

  // ── Redis (used when backend is 'redis') ──────────────────────────────
  redis: {
    connection: undefined,
    prefix: 'rl:',
  },

  // ── Named Policies ────────────────────────────────────────────────────
  policies: {
    api: { limit: 60, window: 60, key: 'user:{userId}' },
    login: { limit: 10, window: 60, key: 'ip:{ip}' },
    upload: { limit: 20, window: 60, key: 'user:{userId}' },
    webhook: { limit: 100, window: 60, key: 'webhook:{subscriptionId}' },
  },

  // ── Response Headers ──────────────────────────────────────────────────
  headers: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After',
  },

  // ── Behavior ──────────────────────────────────────────────────────────
  includeHeaders: true,

  // ── Global Guard ──────────────────────────────────────────────────────
  globalGuard: false,
};
