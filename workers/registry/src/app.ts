/**
 * @file app.ts
 * @description Application Registry composition root.
 *
 * Cross-cutting middleware is configured here; HTTP behavior is implemented in
 * cohesive route modules under `routes/`.
 */
import { Hono } from "hono";
import { createWorkerLogger, getWorkerLogger, type WorkerLogVariables } from "@figentra/observability/worker";
import type { RegistryBindings } from "./interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "./interfaces/registry-variables.interface.js";
import { authenticateRegistryRequest } from "./middleware/authentication.middleware.js";
import { establishRequestContext } from "./middleware/request-context.middleware.js";
import { registerRegistryRoutes } from "./routes/index.js";

/**
 * Creates the Application Registry Worker.
 *
 * @returns Fully configured Registry Hono application.
 */
export function createRegistry(): Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables & WorkerLogVariables }> {
  const app = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables & WorkerLogVariables }>();

  /**
   * Establishes request IDs and baseline security response headers.
   */
  app.use("*", establishRequestContext);

  /**
   * Emits structured request logs through Pino with no Node-only transport.
   */
  app.use("*", createWorkerLogger());

  app.use("/v1/*", authenticateRegistryRequest);

  registerRegistryRoutes(app);

  /**
   * Converts unexpected failures into a stable Registry API error.
   */
  app.onError((error, c) => {
    getWorkerLogger(c).error({
      error,
      requestId: c.req.header("x-request-id"),
    });

    return c.json(
      { error: "internal_error", requestId: c.req.header("x-request-id") },
      500,
    );
  });

  return app;
}
