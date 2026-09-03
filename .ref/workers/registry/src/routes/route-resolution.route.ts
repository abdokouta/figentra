/**
 * @file route-resolution.route.ts
 * @description Private Gateway route-resolution endpoint.
 *
 * @security Requires a service principal with route-resolution permission and
 * the dedicated route-resolution audience.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import type { RegistryClaims } from "../interfaces/registry-claims.interface";

import { REGISTRY_ROUTE_RESOLUTION_PERMISSION } from "../constants/route-resolution-permission.constant";
import { ROUTE_CACHE_TTL_SECONDS } from "../constants/route-cache-ttl.constant";

/**
 * Checks whether a verified Registry JWT includes the expected audience.
 *
 * @param claims - Verified Registry claims.
 * @param expected - Required audience.
 * @returns True when the expected audience is present.
 */
function hasAudience(claims: RegistryClaims, expected: string): boolean {
  return Array.isArray(claims.aud) ? claims.aud.includes(expected) : claims.aud === expected;
}

/**
 * Creates private route-resolution routes.
 *
 * @returns Route-resolution sub-application.
 */
export function createRouteResolutionRoutes(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables;
}> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Resolves a Gateway route from authoritative D1 metadata.
   *
   * @security Requires the dedicated route-resolution service permission.
   *
   * @param c - Hono request context.
   */
  router.get("/resolve", async (c) => {
    const claims = c.get("registryClaims");

    if (
      claims.principal_type !== "service" ||
      !claims.permissions?.includes(REGISTRY_ROUTE_RESOLUTION_PERMISSION) ||
      !hasAudience(claims, c.env.REGISTRY_ROUTE_RESOLUTION_AUDIENCE)
    ) {
      return c.json({ error: "forbidden", reason: "route_resolution_permission_required" }, 403);
    }

    const method = c.req.query("method")?.toUpperCase();
    const path = c.req.query("path");

    if (!method || !path) {
      return c.json({ error: "method_and_path_required" }, 400);
    }

    const cacheKey = `route:${method}:${path}`;

    if (c.env.REGISTRY_CACHE) {
      const cached = await c.env.REGISTRY_CACHE.get(cacheKey, "json");
      if (cached)
        return c.json(cached, 200, {
          "cache-control": "private, max-age=30",
        });
    }

    const rows = await c.env.DB.prepare(
      `SELECT id, path_pattern, upstream, audience,
                required_permission AS requiredPermission,
                metadata_json
         FROM application_routes
         WHERE method = ?
         ORDER BY length(path_pattern) DESC
         LIMIT 500`,
    )
      .bind(method)
      .all<{
        id: string;
        path_pattern: string;
        upstream: string;
        audience: string;
        requiredPermission: string | null;
        metadata_json: string;
      }>();

    const match = rows.results.find((candidate) => {
      try {
        const pattern = new URLPattern({
          pathname: candidate.path_pattern,
        });
        return pattern.test(`https://registry.internal${path}`);
      } catch {
        return false;
      }
    });

    if (!match) return c.json({ error: "route_not_found" }, 404);

    const result = {
      id: match.id,
      upstream: match.upstream,
      audience: match.audience,
      requiredPermission: match.requiredPermission,
      metadata: JSON.parse(match.metadata_json || "{}"),
    };

    if (c.env.REGISTRY_CACHE) {
      await c.env.REGISTRY_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: ROUTE_CACHE_TTL_SECONDS,
      });
    }

    return c.json(result, 200, {
      "cache-control": "private, max-age=30",
    });
  });

  return router;
}
