/**
 * @file health.test.ts
 * @description E2E smoke test for the {{SLUG}} Worker health endpoint.
 *   Runs inside the `vitest-pool-workers` pool (actual workerd runtime).
 */

import { describe, expect, it } from "vitest";

describe("{{SLUG}} Worker — e2e", () => {
  it("should respond 200 on GET /health", async () => {
    // TODO: use @stackra/testing/worker's createWorkerFetch() to
    // make a real request against the local Worker instance.
    expect(true).toBe(true);
  });

  it("should respond 404 on unknown routes", async () => {
    expect(true).toBe(true);
  });
});
