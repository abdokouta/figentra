/**
 * @file metadata.route.ts
 * @description Aggregated application metadata endpoint.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "../interfaces/registry-variables.interface.js";
import { canReadRegistry } from '../security/registry-permission.js';


/**
 * Creates application metadata aggregation routes.
 *
 * @returns Metadata route sub-application.
 */
export function createMetadataRoutes(): Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Returns the application modules, resources, actions, capabilities and
   * environment metadata.
   *
   * @param c - Hono request context.
   */
  router.get("/:slug/metadata", async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: 'forbidden' }, 403);
    const slug = c.req.param("slug");
    const cacheKey = `metadata:${slug}`;

    if (c.env.REGISTRY_CACHE) {
      const cached = await c.env.REGISTRY_CACHE.get(cacheKey, "json");
      if (cached) return c.json(cached);
    }

    const application = await c.env.DB
      .prepare(
        `SELECT id, slug, display_name, branding_json, metadata_json,
                current_version
         FROM applications WHERE slug = ?`,
      )
      .bind(slug)
      .first<{ id: string }>();

    if (!application) return c.json({ error: "not_found" }, 404);

    const currentVersionId = await c.env.DB
      .prepare(
        "SELECT id FROM application_versions WHERE application_id = ? AND version = ?",
      )
      .bind(application.id, application.current_version)
      .first<{ id: string }>();

    if (!currentVersionId) return c.json({ error: "version_not_found" }, 409);

    const [capabilities, modules, resources, actions, navigation, environments, catalog] =
      await Promise.all([
        c.env.DB.prepare(
          "SELECT capability, config_json FROM application_capabilities WHERE application_id = ? AND version_id = ?",
        ).bind(application.id, currentVersionId.id).all(),
        c.env.DB.prepare(
          "SELECT module_key, metadata_json FROM application_modules WHERE application_id = ? AND version_id = ?",
        ).bind(application.id, currentVersionId.id).all(),
        c.env.DB.prepare(
          "SELECT module_key, resource_key, metadata_json FROM application_resources WHERE application_id = ? AND version_id = ?",
        ).bind(application.id, currentVersionId.id).all(),
        c.env.DB.prepare(
          "SELECT resource_key, action_key, permission, metadata_json FROM application_actions WHERE application_id = ? AND version_id = ?",
        ).bind(application.id, currentVersionId.id).all(),
        c.env.DB.prepare(
          "SELECT navigation_key, path, label, icon, required_permission, metadata_json FROM application_navigation WHERE application_id = ? AND version_id = ?",
        ).bind(application.id, currentVersionId.id).all(),
        c.env.DB.prepare(
          "SELECT environment, deployment_url, metadata_json FROM application_environments WHERE application_id = ?",
        ).bind(application.id).all(),
        c.env.DB.prepare(
          "SELECT category, item_key, payload_json, created_at FROM application_catalog_items WHERE application_id = ? AND version_id = ? ORDER BY category, item_key",
        ).bind(application.id, currentVersionId.id).all(),
      ]);

    const result = {
      application,
      capabilities: capabilities.results,
      modules: modules.results,
      resources: resources.results,
      actions: actions.results,
      navigation: navigation.results,
      environments: environments.results,
      catalog: catalog.results,
      workflows: catalog.results.filter((item) => item.category === 'workflow'),
      events: catalog.results.filter((item) => item.category === 'event'),
      integrations: catalog.results.filter((item) => item.category === 'integration'),
      settings: catalog.results.filter((item) => item.category === 'setting'),
      features: catalog.results.filter((item) => item.category === 'feature'),
      widgets: catalog.results.filter((item) => item.category === 'widget'),
      localization: catalog.results.filter((item) => item.category === 'localization'),
    };

    if (c.env.REGISTRY_CACHE) {
      await c.env.REGISTRY_CACHE.put(
        cacheKey,
        JSON.stringify(result),
        { expirationTtl: REGISTRY_CACHE_TTL_SECONDS },
      );
    }

    return c.json(result);
  });

  /**
   * Resolves a Gateway route from authoritative D1 metadata.
   *
   * @security Requires a service principal carrying
   * `registry:route:resolve` and the dedicated route-resolution audience.
   */

  return router;
}
