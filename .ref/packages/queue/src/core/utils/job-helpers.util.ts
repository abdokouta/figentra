/**
 * @file job-helpers.util.ts
 * @module @stackra/queue/core/utils
 * @description Utility functions for job ID generation, backoff computation,
 *   and deduplication key computation.
 */

/**
 * Generate a unique job ID (UUID-like).
 *
 * Uses crypto.randomUUID when available, falls back to timestamp + random.
 *
 * @returns A unique job identifier string
 */
export function generateJobId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Compute exponential backoff delay with a maximum cap.
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseMs - Base delay in ms (default: 1000)
 * @param maxMs - Maximum delay cap in ms (default: 30000)
 * @returns Delay in milliseconds
 *
 * @example
 * ```typescript
 * computeBackoff(1, 1000, 30000); // 1000
 * computeBackoff(2, 1000, 30000); // 2000
 * computeBackoff(3, 1000, 30000); // 4000
 * computeBackoff(5, 1000, 30000); // 16000
 * computeBackoff(10, 1000, 30000); // 30000 (capped)
 * ```
 */
export function computeBackoff(
  attempt: number,
  baseMs: number = 1000,
  maxMs: number = 30000
): number {
  const delay = baseMs * Math.pow(2, attempt - 1);
  return Math.min(delay, maxMs);
}

/**
 * Compute a deterministic unique ID from job name and data for deduplication.
 *
 * Uses a simple hash of the serialized input. Two jobs with the same name
 * and data produce the same uniqueId — enabling deduplication checks.
 *
 * @param name - Job name
 * @param data - Job payload
 * @returns A deterministic hash string
 */
export function computeUniqueId(name: string, data: unknown): string {
  const input = `${name}:${JSON.stringify(data)}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32-bit integer
  }
  return `dedup_${Math.abs(hash).toString(36)}`;
}
