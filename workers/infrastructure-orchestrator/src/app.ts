/**
 * @file app.ts
 * @description Infrastructure Orchestrator composition root.
 *
 * The Worker authenticates and records infrastructure intent. Terraform itself
 * executes only in the isolated Container runner through a Workflow.
 */
import { Hono } from "hono";
import { createWorkerLogger, getWorkerLogger, type WorkerLogVariables } from "@figentra/observability/worker";
import type { OrchestratorBindings } from "./interfaces/orchestrator-bindings.interface.js";
import type { OrchestratorVariables } from "./interfaces/orchestrator-variables.interface.js";
import { registerOrchestratorRoutes } from "./routes/index.js";
import { authenticateInfrastructureRequest } from "./middleware/authentication.middleware.js";
import { establishRequestContext } from "./middleware/request-context.middleware.js";

/**
 * Creates the Infrastructure Orchestrator Worker.
 *
 * @returns Fully configured Hono application.
 */
export function createInfrastructureOrchestrator(): Hono<{
  Bindings: OrchestratorBindings;
  Variables: OrchestratorVariables & WorkerLogVariables;
}> {
  const app = new Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables & WorkerLogVariables }>();

  /**
   * Applies control-plane response security headers.
   */
  app.use("*", establishRequestContext);

  /**
   * Emits structured request logs through Pino with no Node-only transport.
   */
  app.use("*", createWorkerLogger());

  app.use("*", async (c, next) => {
    c.header("x-content-type-options", "nosniff");
    c.header("x-frame-options", "DENY");
    c.header("referrer-policy", "no-referrer");
    c.header("cache-control", "no-store");
    await next();
  });

  app.use("/v1/*", authenticateInfrastructureRequest);

  registerOrchestratorRoutes(app);

  /**
   * Converts unexpected failures into a stable control-plane response.
   */
  app.onError((error, c) => {
    getWorkerLogger(c).error({
      error,
      requestId: c.req.header("x-request-id"),
    });
    return c.json({ error: "internal_error" }, 500);
  });

  return app;
}
