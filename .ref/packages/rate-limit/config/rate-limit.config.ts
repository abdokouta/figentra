/**
 * @file rate-limit.config.ts
 * @module @stackra/nestjs-rate-limit/config
 * @description Default rate limit configuration with all named policies.
 *   Copy to your application's config/ directory for customization:
 *   `stackra config:publish rate-limit`
 *
 * ## Architecture
 *
 * Rate limiting is enforced globally via `RateLimitGuard` which reads
 * `@RateLimit({ policy: 'name' })` metadata from controllers/resolvers.
 * Works for BOTH HTTP REST and GraphQL contexts.
 *
 * ## Environment Variables
 *
 * | Variable               | Description                    | Default  |
 * | ---------------------- | ------------------------------ | -------- |
 * | `RATE_LIMIT_BACKEND`   | Backend: 'redis' or 'memory'   | 'redis'  |
 * | `RATE_LIMIT_ENABLED`   | Enable/disable rate limiting   | 'true'   |
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Backend
  |--------------------------------------------------------------------------
  |
  | The storage backend for rate limit counters.
  | - 'redis' — distributed, production-grade (uses @stackra/redis)
  | - 'memory' — in-process, for development/testing only
  |
  */
  backend: 'redis',

  /*
  |--------------------------------------------------------------------------
  | Global Guard
  |--------------------------------------------------------------------------
  |
  | When set to a policy name, ALL routes without an explicit @RateLimit()
  | decorator will use this policy. Set to null to only rate-limit
  | explicitly decorated routes.
  |
  */
  globalGuard: 'api',

  /*
  |--------------------------------------------------------------------------
  | Response Headers
  |--------------------------------------------------------------------------
  |
  | Whether to include rate limit headers in HTTP responses and
  | custom header names.
  |
  */
  includeHeaders: true,
  headers: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After',
  },

  /*
  |--------------------------------------------------------------------------
  | Named Policies
  |--------------------------------------------------------------------------
  |
  | Each policy defines: limit (requests per window), window (seconds),
  | and key (template with {userId}, {ownerId}, {ip}, {method} placeholders).
  |
  | Usage: @RateLimit({ policy: 'login' })
  |
  */
  policies: {
    /*
    |----------------------------------------------------------------------
    | General API (default for all REST endpoints)
    |----------------------------------------------------------------------
    */
    api: { limit: 60, window: 60, key: 'user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | GraphQL (higher limit — single endpoint, multiple operations)
    |----------------------------------------------------------------------
    */
    graphql: { limit: 120, window: 60, key: 'user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | Authentication (strict — prevent brute force)
    |----------------------------------------------------------------------
    */
    login: { limit: 5, window: 300, key: 'ip:{ip}' },
    'auth-refresh': { limit: 10, window: 60, key: 'user:{userId}' },
    mfa: { limit: 5, window: 300, key: 'ip:{ip}:user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | AI (moderate — LLM calls are expensive)
    |----------------------------------------------------------------------
    */
    ai: { limit: 30, window: 60, key: 'user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | File Operations
    |----------------------------------------------------------------------
    */
    upload: { limit: 10, window: 60, key: 'user:{userId}' },
    export: { limit: 5, window: 60, key: 'tenant:{ownerId}' },

    /*
    |----------------------------------------------------------------------
    | Webhooks (inbound from external services)
    |----------------------------------------------------------------------
    */
    'webhook-inbound': { limit: 100, window: 60, key: 'ip:{ip}' },

    /*
    |----------------------------------------------------------------------
    | Communication (per-tenant to prevent spam)
    |----------------------------------------------------------------------
    */
    email: { limit: 50, window: 60, key: 'tenant:{ownerId}' },
    sms: { limit: 20, window: 60, key: 'tenant:{ownerId}' },
    notification: { limit: 100, window: 60, key: 'tenant:{ownerId}' },

    /*
    |----------------------------------------------------------------------
    | Transactions (sensitive — lower limits)
    |----------------------------------------------------------------------
    */
    payment: { limit: 30, window: 60, key: 'tenant:{ownerId}' },
    order: { limit: 20, window: 60, key: 'user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | Bulk Operations (very low — resource intensive)
    |----------------------------------------------------------------------
    */
    bulk: { limit: 5, window: 60, key: 'tenant:{ownerId}' },
    'rag-ingest': { limit: 10, window: 60, key: 'tenant:{ownerId}' },

    /*
    |----------------------------------------------------------------------
    | PubSub / Realtime
    |----------------------------------------------------------------------
    */
    pubsub: { limit: 60, window: 60, key: 'user:{userId}' },

    /*
    |----------------------------------------------------------------------
    | Documentation (prevent scraping)
    |----------------------------------------------------------------------
    */
    docs: { limit: 30, window: 60, key: 'ip:{ip}' },
  },
};
