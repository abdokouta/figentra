/**
 * @file create-test-container.ts
 * @module @stackra/testing/core/container
 * @description Factory helper for `TestContainer` — accepts an
 *   iterable of `[token, value]` pairs so consumers can wire up
 *   several bindings in one call.
 */

import { TestContainer } from "./test-container";
import type { ITestContainer } from "./test-container.interface";

/**
 * Return a fresh `TestContainer`. Optionally seed it with a
 * batch of `[token, value]` pairs.
 *
 * @example
 * ```ts
 * const container = createTestContainer([
 *   [LOGGER_MANAGER, createMockLogger()],
 *   [CACHE_MANAGER, createMockCache()],
 * ]);
 * ```
 */
export function createTestContainer(
  providers?: Iterable<readonly [unknown, unknown]>,
): ITestContainer {
  return new TestContainer(providers);
}
