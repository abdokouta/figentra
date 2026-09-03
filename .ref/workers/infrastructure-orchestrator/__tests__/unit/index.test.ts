/**
 * @file index.test.ts
 * @description Infrastructure Orchestrator application composition tests.
 */
import { describe, expect, it } from "vitest";
import { createInfrastructureOrchestrator } from "../../src/app";

describe("Infrastructure Orchestrator", () => {
  /** Verifies that the Worker composition root is constructible. */
  it("creates the Hono application", () => {
    const app = createInfrastructureOrchestrator();
    expect(app).toBeDefined();
  });
});
