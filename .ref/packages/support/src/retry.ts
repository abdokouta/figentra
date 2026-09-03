/**
 * @file retry.ts
 * @module @stackra/ts-support
 * @description Retry an async operation with configurable backoff strategy.
 *   Supports linear and exponential backoff, conditional retry via predicate,
 *   and a maximum number of attempts.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Retry an async function with configurable backoff.
 *
 * Executes the given function up to `times` attempts. On failure, waits
 * according to the backoff strategy before retrying. If a `when` predicate
 * is provided, only retries when the predicate returns true for the error.
 *
 * @typeParam T - The return type of the function
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the first successful execution
 * @throws The last error if all attempts fail
 *
 * @example
 * ```typescript
 * import { retry } from '@stackra/ts-support';
 *
 * // Basic retry with defaults (3 attempts, 100ms linear backoff)
 * const result = await retry(() => fetchData('/api/users'));
 *
 * // Custom configuration
 * const data = await retry(
 *   () => unstableApi.call(),
 *   {
 *     times: 5,
 *     delay: 200,
 *     backoff: 'exponential',
 *     when: (err) => err.message.includes('timeout'),
 *   }
 * );
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const times = options?.times ?? 3;
  const baseDelay = options?.delay ?? 100;
  const backoff = options?.backoff ?? 'linear';
  const when = options?.when;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (error: Error | any) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If a predicate is provided and rejects the error, throw immediately
      if (when && !when(lastError)) {
        throw lastError;
      }

      // Don't wait after the last attempt
      if (attempt < times) {
        const delayMs =
          backoff === 'exponential' ? baseDelay * Math.pow(2, attempt - 1) : baseDelay * attempt;

        await sleep(delayMs);
      }
    }
  }

  throw lastError!;
}

// ════════════════════════════════════════════════════════════════════════════════
// Internal Helper
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Internal sleep function to avoid circular dependency with sleep.ts.
 *
 * @param ms - Milliseconds to wait
 * @returns A promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
