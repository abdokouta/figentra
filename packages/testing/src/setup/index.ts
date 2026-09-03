/**
 * @file index.ts
 * @module @stackra/testing/setup
 * @description Side-effect entry point that arms every consumer's
 *   test suite with the workspace's canonical setup: custom
 *   matchers, `afterEach` time restoration, and any future default
 *   hooks.
 *
 *   Consumers add it to their `test.setupFiles` OR import it
 *   directly at the top of their per-package `__tests__/vitest.setup.ts`.
 *   Either shape works — the module runs its side effects at load
 *   time.
 *
 * @example
 * ```ts
 * // __tests__/vitest.setup.ts
 * import "@stackra/testing/setup";
 * ```
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * export default defineConfig({
 *   test: { setupFiles: ["@stackra/testing/setup"] },
 * });
 * ```
 */

import { afterEach } from "vitest";

import { registerAllMatchers } from "../matchers";
import { restoreTime } from "../core/time/restore-time";

// ─── Register custom matchers ──────────────────────────────────────
//
// Runs at module load — every consumer's `expect()` picks up
// `.toBeUlid()` / `.toMatchZodSchema()` / `.toHaveBeenCalledWithinLast()`
// without a further call.
registerAllMatchers();

// ─── Auto-cleanup ──────────────────────────────────────────────────
//
// Restore the real clock after every test. Consumers who freeze
// time in a test never need to remember to unfreeze it — the setup
// hook handles it. Safe even for tests that never call `freezeTime`
// (the underlying `restoreTime()` is a no-op when not frozen).
afterEach(() => {
  restoreTime();
});
