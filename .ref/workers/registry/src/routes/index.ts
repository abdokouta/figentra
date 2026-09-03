/**
 * @file index.ts
 * @description Application Registry route composition.
 */
import type { Hono } from "hono";
import type { WorkerLogVariables } from "@figentra/observability/worker";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import { createApplicationRoutes } from "./application.route";
import { createCatalogRoutes } from "./catalog.route";
import { createHealthRoutes } from "./health.route";
import { createMetadataRoutes } from "./metadata.route";
import { createPermissionRoutes } from "./permission.route";
import { createRegistrationRoutes } from "./registration.route";
import { createRouteResolutionRoutes } from "./route-resolution.route";
import { createVersionRoutes } from "./version.route";
import { createWorkflowRoutes } from "./workflow.route";

/**
 * Registers all Registry route modules.
 *
 * @param app - Registry Hono application.
 */
export function registerRegistryRoutes(
  app: Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables & WorkerLogVariables }>,
): void {
  app.route("/", createHealthRoutes());
  app.route("/v1/applications", createApplicationRoutes());
  app.route("/v1/applications", createVersionRoutes());
  app.route("/v1/applications", createMetadataRoutes());
  app.route("/v1/registrations", createRegistrationRoutes());
  app.route("/v1/routes", createRouteResolutionRoutes());
  app.route("/v1/catalog", createCatalogRoutes());
  app.route("/v1/permissions", createPermissionRoutes());
  app.route("/v1/workflows", createWorkflowRoutes());
}
