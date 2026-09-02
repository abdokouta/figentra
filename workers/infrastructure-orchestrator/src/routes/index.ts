/**
 * @file index.ts
 * @description Infrastructure Orchestrator route composition.
 */
import type { Hono } from "hono";
import type { OrchestratorBindings } from "../interfaces/orchestrator-bindings.interface.js";
import type { OrchestratorVariables } from "../interfaces/orchestrator-variables.interface.js";
import { createHealthRoutes } from "./health.route.js";
import { createJobRoutes } from "./jobs.route.js";

/**
 * Registers Orchestrator route modules.
 *
 * @param app - Orchestrator Hono application.
 */
export function registerOrchestratorRoutes(
  app: Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }>,
): void {
  app.route("/", createHealthRoutes());
  app.route("/v1/jobs", createJobRoutes());
}
