/**
 * @file health.route.ts
 * @description Infrastructure Orchestrator health endpoints.
 */
import { Hono } from "hono";
import type { OrchestratorBindings } from "../interfaces/orchestrator-bindings.interface";
import type { OrchestratorVariables } from "../interfaces/orchestrator-variables.interface";

/**
 * Creates Orchestrator health routes.
 *
 * @returns Health route sub-application.
 */
export function createHealthRoutes(): Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }> {
  const router = new Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }>();

  /**
   * Reports Worker liveness without dependency access.
   */
  router.get("/health/live", (c) => c.json({ status: "ok" }));

  /**
   * Reports D1 readiness without exposing dependency details.
   */
  router.get("/health/ready", async (c) => {
    try {
      await c.env.DB.prepare("SELECT 1 AS ok").first();
      return c.json({ status: "ready" });
    } catch {
      return c.json({ status: "not_ready" }, 503);
    }
  });

  return router;
}
