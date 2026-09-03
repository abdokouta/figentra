/**
 * @file health.route.ts
 * @description Application Registry health endpoints.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";

/**
 * Creates Registry health routes.
 *
 * @returns Health route sub-application.
 */
export function createHealthRoutes(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables;
}> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Reports liveness without contacting D1.
   */
  router.get("/health/live", (c) => c.json({ status: "ok" }));

  /**
   * Reports readiness when authoritative D1 is reachable.
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
