/**
 * @file rate-limiter-backend.interface.ts
 * @module @stackra/nestjs-rate-limit/interfaces
 * @description Driver-level contract for rate limiter backends.
 *   Each backend (Redis, memory, cache) implements these primitives.
 *   The RateLimiterManager orchestrates calls to the active backend.
 */

// ============================================================================
// Interface
// ============================================================================

/**
 * Rate limiter backend driver contract.
 *
 * Backends provide atomic counter operations for token-bucket rate limiting.
 * Implementations must be stateless (safe for singleton binding) except
 * for connection handles.
 *
 * Available backends:
 * - `redis` — atomic Lua script, production-grade, no race conditions
 * - `memory` — in-process Map, for tests and single-instance deployments
 */
export interface IRateLimiterBackend {
  /**
   * Backend identifier (e.g., 'redis', 'memory').
   *
   * @returns The backend name string
   */
  name(): string;

  /**
   * Increment the counter for a bucket and return the new count.
   * Sets TTL on first hit (counter creation).
   *
   * @param key - Bucket identifier (already namespaced by caller)
   * @param windowSeconds - TTL for the bucket key
   * @returns The new counter value after increment
   */
  hit(key: string, windowSeconds: number): Promise<number>;

  /**
   * Get the current attempt count for a bucket.
   *
   * @param key - Bucket identifier
   * @returns Current counter value (0 if bucket doesn't exist)
   */
  attempts(key: string): Promise<number>;

  /**
   * Get seconds remaining until the bucket resets (TTL).
   *
   * @param key - Bucket identifier
   * @returns Seconds until reset (0 if bucket doesn't exist)
   */
  availableIn(key: string): Promise<number>;

  /**
   * Clear a bucket entirely (reset counter).
   *
   * @param key - Bucket identifier
   */
  clear(key: string): Promise<void>;
}
