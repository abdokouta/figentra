/**
 * @file catalog.route.ts
 * @description First-class Registry category query endpoints.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import { canReadRegistry } from "../security/registry-permission";

const categories = [
  "event",
  "workflow",
  "integration",
  "setting",
  "feature",
  "widget",
  "localization",
] as const;
type CatalogCategory = (typeof categories)[number];

function isCategory(value: string): value is CatalogCategory {
  return (categories as readonly string[]).includes(value);
}

/** Creates first-class catalog category query routes. */
export function createCatalogRoutes(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables;
}> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  router.get("/:category", async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: "forbidden" }, 403);
    const category = c.req.param("category");
    if (!isCategory(category)) return c.json({ error: "unsupported_category" }, 404);

    const application = c.req.query("application");
    const version = c.req.query("version");
    const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "100"), 1), 500);

    const conditions = ["aci.category = ?"];
    const bindings: unknown[] = [category];
    if (application) {
      conditions.push("a.slug = ?");
      bindings.push(application);
    }
    if (version) {
      conditions.push("v.version = ?");
      bindings.push(version);
    } else {
      conditions.push(
        "v.id = (SELECT current_v.id FROM application_versions current_v WHERE current_v.application_id = a.id AND current_v.version = a.current_version)",
      );
    }

    const result = await c.env.DB.prepare(
      `SELECT a.slug AS application, v.version, aci.category, aci.item_key, aci.payload_json, aci.created_at
       FROM application_catalog_items aci
       JOIN applications a ON a.id = aci.application_id
       JOIN application_versions v ON v.id = aci.version_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY a.slug, aci.item_key
       LIMIT ?`,
    )
      .bind(...bindings, limit)
      .all();

    return c.json({ category, count: result.results.length, items: result.results });
  });

  return router;
}
