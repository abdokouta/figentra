/**
 * @file timebox.ts
 * @module @stackra/ts-support
 * @description Constant-time execution wrapper.
 *   Ensures that a function always takes at least a specified amount of time
 *   to complete, preventing timing-based side-channel attacks. Useful for
 *   authentication flows, password checks, and token comparisons.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Execute a function ensuring it always takes at least the specified time.
 *
 * This prevents timing attacks by normalizing execution time regardless of
 * the code path taken inside the function. If the function completes before
 * the minimum time, the remaining time is consumed as a delay.
 *
 * If the function throws, the error is still thrown — but only after the
 * minimum time has elapsed.
 *
 * @typeParam T - The return type of the function
 * @param fn - The async function to execute
 * @param microseconds - Minimum execution time in microseconds (1000 μs = 1 ms)
 * @returns The result of the function
 * @throws Re-throws any error from the function, after the minimum time
 *
 * @example
 * ```typescript
 * import { timebox } from '@stackra/ts-support';
 *
 * // Password verification always takes at least 200ms
 * const isValid = await timebox(
 *   () => verifyPassword(input, hash),
 *   200_000 // 200ms in microseconds
 * );
 *
 * // Token comparison always takes at least 50ms
 * const match = await timebox(
 *   () => compareTokens(provided, stored),
 *   50_000
 * );
 * ```
 */
export async function timebox<T>(fn: () => Promise<T>, microseconds: number): Promise<T> {
  const minimumMs = microseconds / 1000;
  const start = now();

  let result: T;
  let error: unknown;
  let hasError = false;

  try {
    result = await fn();
  } catch (e: Error | any) {
    error = e;
    hasError = true;
  }

  // Calculate how much time remains to fill the minimum
  const elapsed = now() - start;
  const remaining = minimumMs - elapsed;

  // If we finished early, sleep for the remaining time
  if (remaining > 0) {
    await sleep(remaining);
  }

  if (hasError) {
    throw error;
  }

  return result!;
}

// ════════════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get current high-resolution timestamp in milliseconds.
 *
 * @returns Current time in ms
 */
function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/**
 * Internal sleep to avoid circular imports.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
