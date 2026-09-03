/**
 * @file concurrency.mjs
 * @module scripts/_lib/concurrency
 * @description Bounded-parallel task runner for scripts that fan out over
 *   N items (repos, files, packages, HTTP calls).
 *
 *   Uses a hand-rolled semaphore + async iterator — no external deps. The
 *   pool guarantees:
 *
 *     - Never more than `concurrency` tasks running at once.
 *     - Tasks that throw don't cascade — the pool captures and returns
 *       results as `{ status: 'fulfilled' | 'rejected' }` (matches
 *       `Promise.allSettled` shape).
 *     - Progress callback fires per settled task so scripts can log
 *       progress bars / dots.
 *
 * ## Usage
 *
 * ```javascript
 * import { pool } from "./_lib/concurrency.mjs";
 *
 * const items = ["a", "b", "c", "d"];
 * const results = await pool(items, 4, async (item) => {
 *   // ... do work on item
 *   return item.toUpperCase();
 * });
 *
 * // results = [{ status: 'fulfilled', value: 'A' }, ...]
 * ```
 *
 * ## Progress
 *
 * ```javascript
 * const results = await pool(items, 4, worker, {
 *   onProgress: (done, total) => log.info(`${done}/${total}`),
 * });
 * ```
 */

/**
 * @template T, R
 * @typedef {object} PoolOptions
 * @property {(done: number, total: number) => void} [onProgress]
 *   Called each time a task completes (success or failure).
 */

/**
 * @template T, R
 * @typedef {{ status: 'fulfilled', value: R } | { status: 'rejected', reason: unknown, item: T }} SettledResult
 */

/**
 * Run `worker(item)` across every item in `items`, keeping at most
 * `concurrency` workers in flight. Returns settled results in the SAME order
 * as `items`.
 *
 * @template T, R
 * @param {readonly T[]} items
 * @param {number} concurrency  Max in-flight workers. Clamped to `[1, items.length]`.
 * @param {(item: T, index: number) => Promise<R>} worker
 * @param {PoolOptions<T, R>} [options]
 * @returns {Promise<SettledResult<T, R>[]>}
 */
export async function pool(items, concurrency, worker, options = {}) {
  const total = items.length;
  const bound = Math.max(1, Math.min(concurrency, total || 1));

  /** @type {SettledResult<T, R>[]} */
  const results = new Array(total);

  let cursor = 0;
  let completed = 0;

  // Spawn `bound` workers; each consumes items from a shared cursor.
  const workers = Array.from({ length: bound }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= total) return;

      const item = items[index];
      try {
        const value = await worker(item, index);
        results[index] = { status: "fulfilled", value };
      } catch (err) {
        results[index] = { status: "rejected", reason: err, item };
      } finally {
        completed++;
        options.onProgress?.(completed, total);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Convenience wrapper — throws if ANY task fails. Returns just the values
 * on success.
 *
 * @template T, R
 * @param {readonly T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} worker
 * @param {PoolOptions<T, R>} [options]
 * @returns {Promise<R[]>}
 */
export async function poolOk(items, concurrency, worker, options) {
  const settled = await pool(items, concurrency, worker, options);
  const failures = settled.filter(
    /** @returns {r is Extract<SettledResult<T, R>, { status: 'rejected' }>} */
    (r) => r.status === "rejected",
  );
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((f) => f.reason),
      `pool: ${failures.length} of ${settled.length} tasks failed`,
    );
  }
  return /** @type {R[]} */ (settled.map((r) => (r.status === "fulfilled" ? r.value : undefined)));
}
