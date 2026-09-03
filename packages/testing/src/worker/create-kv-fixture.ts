/**
 * @file create-kv-fixture.ts
 * @module @stackra/testing/worker
 * @description Per-test KV namespace fixture. Uses Miniflare's
 *   in-memory KV simulator — every write is isolated to the
 *   fixture; two concurrent tests never see each other's data.
 */

import { Miniflare } from "miniflare";
import type { KVNamespace } from "@cloudflare/workers-types";

/** Options for `createKvFixture`. */
export interface ICreateKvFixtureOptions {
  /**
   * Pre-seeded key/value pairs. Written before the fixture is
   * returned so tests can assume the seed data is present.
   */
  readonly seed?: Record<string, string>;
}

/** Handle for a per-test KV namespace. */
export interface IKvFixture {
  /** The KV binding — pass to production code under test. */
  readonly kv: KVNamespace;
  /** Underlying Miniflare instance. */
  readonly mf: Miniflare;
  /** Wipe every key in the namespace. */
  reset(): Promise<void>;
  /** Release Miniflare. Idempotent. */
  dispose(): Promise<void>;
}

/**
 * Build a fresh KV namespace.
 *
 * @example
 * ```ts
 * const kv = await createKvFixture({
 *   seed: { "user:alice": JSON.stringify({ id: "u1" }) },
 * });
 *
 * const raw = await kv.kv.get("user:alice");
 * expect(raw).not.toBeNull();
 *
 * await kv.dispose();
 * ```
 */
export async function createKvFixture(
  options: ICreateKvFixtureOptions = {},
): Promise<IKvFixture> {
  const mf = new Miniflare({
    modules: true,
    script: "export default { async fetch() { return new Response('ok'); } }",
    compatibilityDate: "2026-09-01",
    kvNamespaces: ["KV"],
  });

  await mf.ready;
  const kv = (await mf.getKVNamespace("KV")) as unknown as KVNamespace;

  for (const [key, value] of Object.entries(options.seed ?? {})) {
    await kv.put(key, value);
  }

  let disposed = false;

  return {
    kv,
    mf,
    async reset(): Promise<void> {
      // Miniflare's list() with a max of 1000 covers every test
      // scenario. Fixtures larger than 1000 keys signal a test
      // that's exercising the wrong layer.
      const { keys } = await kv.list({ limit: 1000 });
      for (const { name } of keys) {
        await kv.delete(name);
      }
    },
    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      await mf.dispose();
    },
  };
}
