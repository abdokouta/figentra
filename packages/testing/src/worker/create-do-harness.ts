/**
 * @file create-do-harness.ts
 * @module @stackra/testing/worker
 * @description Durable Object test harness. Wraps a
 *   `DurableObjectNamespace` from Miniflare with a fluent
 *   fetch-into-the-DO helper — no per-test `env.MY_DO.get(id).fetch(...)`
 *   boilerplate.
 *
 *   Handles ID resolution (`idFromName` vs `idFromString`) so tests
 *   can address DOs by human-readable names.
 */

import { Miniflare } from "miniflare";
import type { DurableObjectNamespace, DurableObjectStub } from "@cloudflare/workers-types";

/** Options for `createDoHarness`. */
export interface ICreateDoHarnessOptions {
  /** Path to the Worker's script (must export the DO class). */
  readonly scriptPath: string;

  /** Name of the DO class as exported from the Worker. */
  readonly className: string;

  /** Miniflare binding name for the DO namespace (e.g. `"COUNTER"`). */
  readonly bindingName: string;

  /**
   * Compatibility date. Match the Worker's own `wrangler.jsonc`.
   *
   * @default "2026-09-01"
   */
  readonly compatibilityDate?: string;
}

/** Handle for a Durable Object test namespace. */
export interface IDoHarness {
  /** Underlying Miniflare instance. */
  readonly mf: Miniflare;
  /** The DO namespace binding. */
  readonly ns: DurableObjectNamespace;
  /**
   * Get a `DurableObjectStub` by human-readable name. Uses
   * `idFromName` under the hood — same behaviour as production
   * code that addresses DOs by tenant slug / route key / etc.
   */
  stub(name: string): DurableObjectStub;
  /**
   * Send a request to the DO named `name`. Short-hand for
   * `harness.stub(name).fetch(...)`.
   */
  fetch(name: string, input: string | URL, init?: RequestInit): Promise<Response>;
  /** Release Miniflare. Idempotent. */
  dispose(): Promise<void>;
}

/**
 * Build a Durable Object test harness.
 *
 * @example
 * ```ts
 * const doH = await createDoHarness({
 *   scriptPath: "./dist/index.js",
 *   className: "Counter",
 *   bindingName: "COUNTER",
 * });
 *
 * const res = await doH.fetch("global", "http://do/increment", {
 *   method: "POST",
 * });
 * expect(await res.json()).toEqual({ count: 1 });
 *
 * await doH.dispose();
 * ```
 */
export async function createDoHarness(options: ICreateDoHarnessOptions): Promise<IDoHarness> {
  const { scriptPath, className, bindingName, compatibilityDate = "2026-09-01" } = options;

  const mf = new Miniflare({
    scriptPath,
    modules: true,
    compatibilityDate,
    compatibilityFlags: ["nodejs_compat"],
    durableObjects: { [bindingName]: className },
  });

  await mf.ready;
  const ns = (await mf.getDurableObjectNamespace(bindingName)) as unknown as DurableObjectNamespace;

  let disposed = false;

  return {
    mf,
    ns,
    stub(name: string): DurableObjectStub {
      return ns.get(ns.idFromName(name));
    },
    async fetch(name: string, input: string | URL, init?: RequestInit): Promise<Response> {
      const stub = ns.get(ns.idFromName(name));
      return (stub.fetch as unknown as typeof fetch)(input, init);
    },
    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      await mf.dispose();
    },
  };
}
