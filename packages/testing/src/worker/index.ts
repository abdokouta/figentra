/**
 * @file index.ts
 * @module @stackra/testing/worker
 * @description Public API barrel for the Cloudflare Worker test
 *   toolkit. Every export requires the optional peer `miniflare`
 *   and `@cloudflare/workers-types`.
 */

export {
  createD1Fixture,
  type ICreateD1FixtureOptions,
  type ID1Fixture,
} from "./create-d1-fixture";
export {
  createDoHarness,
  type ICreateDoHarnessOptions,
  type IDoHarness,
} from "./create-do-harness";
export {
  createKvFixture,
  type ICreateKvFixtureOptions,
  type IKvFixture,
} from "./create-kv-fixture";
export {
  createWorkerFetch,
  type ICreateWorkerFetchOptions,
  type IWorkerFetchHandle,
} from "./create-worker-fetch";
