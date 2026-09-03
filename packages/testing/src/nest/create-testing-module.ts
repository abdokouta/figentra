/**
 * @file create-testing-module.ts
 * @module @stackra/testing/nest
 * @description Thin wrapper around `Test.createTestingModule(...)`
 *   from `@nestjs/testing` that adds workspace conventions on top:
 *
 *   - **Provider overrides** — pass `overrides: [[TOKEN, mock]]` to
 *     apply `.overrideProvider(TOKEN).useValue(mock)` in bulk. No
 *     more chained builder calls per token.
 *
 *   - **Returns a builder** — consumers can further customise via
 *     `.overrideProvider()` / `.overrideModule()` / `.compile()`.
 *     The wrapper never forces `.compile()`; consumers who want
 *     the compiled module use `.compile()` themselves.
 */

import { Test, type TestingModuleBuilder } from "@nestjs/testing";
import type { ModuleMetadata } from "@nestjs/common";

/**
 * Options for `createTestingModule`. Extends NestJS's
 * `ModuleMetadata` (imports / controllers / providers / exports)
 * with workspace additions.
 */
export interface INestTestingModuleOptions extends ModuleMetadata {
  /**
   * Batch of provider overrides applied before the builder is
   * returned. Each tuple is `[token, replacementValue]` — the
   * wrapper calls `.overrideProvider(token).useValue(value)` for
   * each.
   *
   * Preferred over chained `.overrideProvider(...)` calls when
   * the test needs three or more overrides.
   */
  readonly overrides?: ReadonlyArray<readonly [unknown, unknown]>;
}

/**
 * Build a `TestingModuleBuilder` — call `.compile()` yourself
 * (or pass the builder to `buildFastifyTestApp` which compiles
 * for you).
 *
 * @example
 * ```ts
 * const builder = createTestingModule({
 *   imports: [FooModule.forRoot()],
 *   overrides: [
 *     [LOGGER_MANAGER, createMockLogger()],
 *     [CACHE_MANAGER, createMockCache()],
 *   ],
 * });
 *
 * const module = await builder.compile();
 * const svc = module.get(FooService);
 * ```
 */
export function createTestingModule(
  options: INestTestingModuleOptions,
): TestingModuleBuilder {
  const { overrides = [], ...metadata } = options;
  let builder = Test.createTestingModule(metadata);
  for (const [token, value] of overrides) {
    builder = builder.overrideProvider(token).useValue(value);
  }
  return builder;
}
