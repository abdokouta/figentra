/**
 * @file version.route.ts
 * @description Immutable application version endpoint.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import { canReadRegistry } from "../security/registry-permission";

/**
 * Creates application version routes.
 *
 * @returns Version route sub-application.
 */
export function createVersionRoutes(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables;
}> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Returns immutable metadata for one application version.
   *
   * @param c - Hono request context.
   */
  router.get("/:slug/versions/:version", async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: "forbidden" }, 403);
    const slug = c.req.param("slug");
    const version = c.req.param("version");

    const row = await c.env.DB.prepare(
      `SELECT a.slug, a.display_name, a.description, a.branding_json,
                a.metadata_json, v.version, v.manifest_hash,
                v.manifest_json, v.created_at
         FROM applications a
         JOIN application_versions v ON v.application_id = a.id
         WHERE a.slug = ? AND v.version = ?`,
    )
      .bind(slug, version)
      .first();

    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json(row);
  });

  /**
   * Returns application modules/resources/actions/capabilities/branding.
   *
   * @security Requires an authenticated control-plane caller.
   */

  return router;
}
