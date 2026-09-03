/**
 * @file create-worker-fetch.ts
 * @module @stackra/testing/worker
 * @description In-process `fetch` client that dispatches into a
 *   Miniflare-simulated Cloudflare Worker. The returned function
 *   has the same signature as the global `fetch` — pass it around
 *   as if you were calling the deployed Worker.
 *
 *   Under the hood this constructs a `Miniflare` instance, ships
 *   the caller's `wrangler.jsonc` bindings into it, and exposes
 *   `.dispatchFetch(url, init)` as the returned function.
 *
 *   The Worker code runs in `workerd` — the same runtime the
 *   deployed Worker uses. No Node shim, no `undici`, no
 *   `whatwg-fetch`.
 */

import { Miniflare, type MiniflareOptions } from "miniflare";

/** Options for `createWorkerFetch`. */
export interface ICreateWorkerFetchOptions {
  /**
   * Path to the entry-point script Miniflare will load. Typically
   * the built `dist/index.js` OR the source if the Worker builds
   * on-the-fly via `wrangler`.
   */
  readonly scriptPath: string;

  /**
   * Wrangler-style bindings to inject. Miniflare accepts every
   * binding shape the deployed Worker supports (D1, KV, R2,
   * Durable Objects, secrets, vars, service bindings, queues).
   */
  readonly bindings?: MiniflareOptions;

  /**
   * Miniflare compatibility date. Match the Worker's own
   * `wrangler.jsonc` for accurate simulation.
   *
   * @default "2026-09-01"
   */
  readonly compatibilityDate?: string;

  /**
   * Additional compatibility flags. `nodejs_compat` is enabled by
   * default — matches the workspace's Worker convention.
   *
   * @default ["nodejs_compat"]
   */
  readonly compatibilityFlags?: readonly string[];
}

/**
 * A `fetch`-compatible handle backed by an in-process Miniflare
 * Worker. The `.dispose()` method shuts the Miniflare instance
 * down; call it in `afterAll` to release resources.
 */
export interface IWorkerFetchHandle {
  /**
   * Dispatch a request into the Worker. Same signature as
   * `globalThis.fetch`.
   */
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;

  /**
   * Access the underlying Miniflare instance — useful when a test
   * needs to peek at KV / D1 / R2 contents directly.
   */
  readonly mf: Miniflare;

  /** Release the Miniflare instance. Safe to call multiple times. */
  dispose(): Promise<void>;
}

/**
 * Build a `fetch`-compatible handle for a Cloudflare Worker.
 *
 * @example
 * ```ts
 * const worker = await createWorkerFetch({
 *   scriptPath: "./dist/index.js",
 *   bindings: {
 *     kvNamespaces: ["CACHE"],
 *     d1Databases: ["DB"],
 *   },
 * });
 *
 * const res = await worker.fetch("http://worker/health");
 * expect(res.status).toBe(200);
 *
 * await worker.dispose();
 * ```
 */
export async function createWorkerFetch(
  options: ICreateWorkerFetchOptions,
): Promise<IWorkerFetchHandle> {
  const {
    scriptPath,
    bindings,
    compatibilityDate = "2026-09-01",
    compatibilityFlags = ["nodejs_compat"],
  } = options;

  const mf = new Miniflare({
    scriptPath,
    modules: true,
    compatibilityDate,
    compatibilityFlags: compatibilityFlags.slice(),
    // Spread caller bindings LAST so they can override any default
    // set above. Cast because MiniflareOptions is a discriminated
    // union that TypeScript doesn't narrow through spread alone.
    ...(bindings as object),
  } as MiniflareOptions);

  // Miniflare v4 boots lazily; force initialisation so any
  // config-time errors surface here rather than on first fetch.
  await mf.ready;

  let disposed = false;

  return {
    mf,
    async fetch(
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> {
      if (disposed) {
        throw new Error(
          "[createWorkerFetch] Attempted to fetch after dispose() was called.",
        );
      }
      // Miniflare's `dispatchFetch` typing widens Request to its own
      // internal shape; a cross-realm cast is safe here because the
      // wire shape is identical.
      return (mf.dispatchFetch as unknown as typeof fetch)(input, init);
    },
    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      await mf.dispose();
    },
  };
}
