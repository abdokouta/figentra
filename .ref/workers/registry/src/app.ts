/**
 * @file app.ts
 * @description Composition root for the Figentra Application Registry Cloudflare Worker.
 *
 * Configures middleware (request context, Pino logging, JWT auth) and registers all route modules.
 */

import { Hono } from "hono";
import {
  createWorkerLogger,
  getWorkerLogger,
  type WorkerLogVariables,
} from "@figentra/observability/worker";
import type { RegistryBindings } from "./interfaces/registry-bindings.interface";
import type { RegistryVariables } from "./interfaces/registry-variables.interface";
import { authenticateRegistryRequest } from "./middleware/authentication.middleware";
import { establishRequestContext } from "./middleware/request-context.middleware";
import { registerRegistryRoutes } from "./routes/index";

/**
 * Creates and configures the Hono Application Registry instance.
 *
 * @returns Fully composed Hono application with middleware and routes.
 */
export function createRegistry(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables & WorkerLogVariables;
}> {
  const app = new Hono<{
    Bindings: RegistryBindings;
    Variables: RegistryVariables & WorkerLogVariables;
  }>();

  app.use("*", establishRequestContext);
  app.use("*", createWorkerLogger());
  app.use("/v1/*", authenticateRegistryRequest);

  registerRegistryRoutes(app);

  app.onError((error, c) => {
    getWorkerLogger(c).error({
      error,
      requestId: c.req.header("x-request-id"),
    });

    return c.json({ error: "internal_error", requestId: c.req.header("x-request-id") }, 500);
  });

  return app;
}
