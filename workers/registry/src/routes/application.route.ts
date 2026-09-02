/**
 * @file application.route.ts
 * @description Current application metadata endpoint.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface.js";
import type { RegistryVariables } from "../interfaces/registry-variables.interface.js";
import { canReadRegistry } from '../security/registry-permission.js';


/**
 * Creates application metadata routes.
 *
 * @returns Application route sub-application.
 */
export function createApplicationRoutes(): Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Returns current metadata for an application.
   *
   * @param c - Hono request context.
   */
  router.get("/:slug", async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: 'forbidden' }, 403);
    const slug = c.req.param("slug");
    const cacheKey = `application:${slug}`;

    if (c.env.REGISTRY_CACHE) {
      const cached = await c.env.REGISTRY_CACHE.get(cacheKey, "json");
      if (cached) return c.json(cached);
    }

    const row = await c.env.DB
      .prepare(
        `SELECT id, slug, display_name, description, status, current_version,
                branding_json, metadata_json, created_at, updated_at
         FROM applications WHERE slug = ?`,
      )
      .bind(slug)
      .first();

    if (!row) return c.json({ error: "not_found" }, 404);

    if (c.env.REGISTRY_CACHE) {
      await c.env.REGISTRY_CACHE.put(
        cacheKey,
        JSON.stringify(row),
        { expirationTtl: REGISTRY_CACHE_TTL_SECONDS },
      );
    }

    return c.json(row);
  });

  /**
   * Returns immutable metadata for one application version.
   *
   * @security Requires an authenticated control-plane caller.
   */

  return router;
}
