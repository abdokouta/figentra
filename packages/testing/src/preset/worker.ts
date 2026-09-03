/**
 * @file worker.ts
 * @module @stackra/testing/preset/worker
 * @description Cloudflare Workers Vitest preset. Composes the base
 *   preset with `@cloudflare/vitest-pool-workers` — tests execute
 *   INSIDE `workerd` (the same runtime the Worker deploys to), not
 *   in a Node shim. That's the only way to catch D1 / KV / Durable
 *   Object / Fetch API regressions before deploy.
 *
 *   Consumers point `wrangler.configPath` at their `wrangler.jsonc`
 *   so the pool sees every binding (D1, KV, R2, DO, secrets, etc.).
 *
 * @example
 * ```ts
 * import { createWorkerPreset } from "@stackra/testing/preset/worker";
 * import { defineConfig, mergeConfig } from "vitest/config";
 *
 * export default mergeConfig(
 *   createWorkerPreset({ wranglerConfigPath: "./wrangler.jsonc" }),
 *   defineConfig({
 *     test: { include: ["__tests__/**\/*.test.ts"] },
 *   }),
 * );
 * ```
 */

import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { defineConfig, mergeConfig } from "vitest/config";

import base from "./base";

/** Options for `createWorkerPreset`. */
export interface IWorkerPresetOptions {
  /**
   * Path to the Worker's `wrangler.jsonc` (or `wrangler.toml`),
   * relative to the consumer's Vitest config. The pool loads every
   * binding declared there (D1, KV, R2, Durable Objects, secrets).
   *
   * @default "./wrangler.jsonc"
   */
  readonly wranglerConfigPath?: string;

  /**
   * Whether tests may perform outbound `fetch()` to the real
   * internet. `false` (default) fails such calls loudly — every
   * test should stub external services. Flip to `true` only for
   * integration suites that legitimately hit staging APIs.
   *
   * @default false
   */
  readonly outboundNetworkAccess?: boolean;

  /**
   * Miniflare compatibility date. Match your Worker's own
   * `wrangler.jsonc` `compatibility_date` for accurate simulation.
   *
   * @default "2026-09-01"
   */
  readonly compatibilityDate?: string;
}

/**
 * Build a Vitest config for a Cloudflare Worker.
 *
 * Composes:
 *
 *   1. The base preset (SWC transform, tsconfig-paths, coverage).
 *   2. `defineWorkersConfig` from
 *      `@cloudflare/vitest-pool-workers` — installs the `workers`
 *      pool + injects Miniflare bindings.
 *
 * The result is a plain Vitest `UserConfig` — callers merge with
 * their own `defineConfig({...})` as usual.
 */
export function createWorkerPreset(options: IWorkerPresetOptions = {}) {
  const {
    wranglerConfigPath = "./wrangler.jsonc",
    outboundNetworkAccess = false,
    compatibilityDate = "2026-09-01",
  } = options;

  // Vitest v4 narrowed `defineConfig` overloads reject the
  // `poolOptions` shape on the base `UserConfig` union arm. The
  // runtime shape is unchanged; we widen the input type at the call
  // site so declaration-emit doesn't get stuck on the narrow
  // overload. See sibling nest.ts for the same pattern.
  const workerLayer = defineWorkersConfig({
    test: {
      poolOptions: {
        workers: {
          isolatedStorage: true,
          singleWorker: false,
          miniflare: {
            compatibilityDate,
            compatibilityFlags: ["nodejs_compat"],
          },
          wrangler: { configPath: wranglerConfigPath },
        },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const overrides = defineConfig({
    test: {
      // Loud when a test hits the real internet unless the consumer
      // opts in — otherwise CI flakes when the upstream API is slow.
      ...(outboundNetworkAccess ? {} : { server: { deps: { external: [] } } }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return mergeConfig(mergeConfig(base, workerLayer), overrides);
}

/**
 * Convenience default export — uses `./wrangler.jsonc` at the
 * consumer's root. Overriding is preferred; use
 * `createWorkerPreset({...})` for non-default paths.
 */
const workerPreset = createWorkerPreset();
export default workerPreset;
