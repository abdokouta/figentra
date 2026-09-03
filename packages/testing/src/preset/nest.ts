/**
 * @file nest.ts
 * @module @stackra/testing/preset/nest
 * @description NestJS-tuned Vitest preset. Extends the base preset
 *   with settings that match NestJS + Fastify service tests:
 *
 *   - `pool: "forks"` — every test file runs in its own child
 *     process. NestJS `TestingModule` instances hold DI singletons
 *     + open resources (`fastify.listen()`); sharing them across
 *     worker threads causes port collisions + shared-state leaks.
 *
 *   - `testTimeout` bumped to 30 s — Nest bootstraps + Fastify
 *     listeners routinely take 3-5 s; 30 s leaves headroom for
 *     integration tests that spin up a full app.
 *
 *   - `test.setupFiles` includes `@stackra/testing/setup` — every
 *     Nest service auto-registers custom matchers + time cleanup.
 *
 * @example
 * ```ts
 * import preset from "@stackra/testing/preset/nest";
 * import { defineConfig, mergeConfig } from "vitest/config";
 *
 * export default mergeConfig(
 *   preset,
 *   defineConfig({
 *     test: { include: ["__tests__/unit/**\/*.test.ts"] },
 *   }),
 * );
 * ```
 */

import { defineConfig, mergeConfig } from "vitest/config";

import base from "./base";

// Vitest v4 tightened its `defineConfig` overloads — `poolOptions`
// only appears on the `TestUserConfig` union arm, not the base
// `UserConfig`. `defineConfig` still accepts it at runtime; we
// widen the input type to `any` at the call site so the
// declaration-emit pass doesn't get stuck on the narrow overload.
// The compiled JS is identical; only the .d.ts emit differs.
const nest = mergeConfig(
  base,
  defineConfig({
    test: {
      // Process-level isolation. NestJS test hosts leak port
      // bindings + timers across module instances when reused
      // inside a shared worker thread; forks give each file a fresh
      // process.
      pool: "forks",
      poolOptions: {
        forks: {
          // Serialise by default — Nest tests routinely bind to
          // ephemeral ports; parallel forks race on the same port
          // range. Consumers can override to enable parallelism per
          // suite.
          singleFork: false,
          maxForks: 4,
          minForks: 1,
        },
      },

      // Nest bootstraps take 3-5 s; 30 s leaves comfortable
      // headroom without hiding runaway integration tests.
      testTimeout: 30_000,
      hookTimeout: 30_000,

      // Auto-register matchers + time cleanup for every Nest
      // service. Consumers can still add their own setup files —
      // Vitest concatenates the list.
      setupFiles: ["@stackra/testing/setup"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any),
);

export default nest;
