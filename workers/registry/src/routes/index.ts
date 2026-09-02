/**
 * @file index.ts
 * @description Application Registry route composition.
 */
import type { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "../interfaces/registry-variables.interface.js";
import { createApplicationRoutes } from "./application.route.js";
import { createCatalogRoutes } from "./catalog.route.js";
import { createHealthRoutes } from "./health.route.js";
import { createMetadataRoutes } from "./metadata.route.js";
import { createPermissionRoutes } from "./permission.route.js";
import { createRegistrationRoutes } from "./registration.route.js";
import { createRouteResolutionRoutes } from "./route-resolution.route.js";
import { createVersionRoutes } from "./version.route.js";
import { createWorkflowRoutes } from "./workflow.route.js";

/**
 * Registers all Registry route modules.
 *
 * @param app - Registry Hono application.
 */
export function registerRegistryRoutes(
  app: Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>,
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
