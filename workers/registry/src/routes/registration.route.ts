/**
 * @file registration.route.ts
 * @description Application registration control-plane route.
 *
 * @security Requires a service principal with explicit registration permission
 * and the dedicated registration audience.
 */
import { Hono } from "hono";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryVariables } from "../interfaces/registry-variables.interface";
import type { RegistryClaims } from "../interfaces/registry-claims.interface";

import { applicationManifestSchema } from "../schemas/application-manifest.schema";
import { validateUpstreams } from "../validators/upstream.validator";
import { sha256 } from "../utils/sha256.util";
import { invalidateRegistryCache } from "../services/registry-cache.service";
import { REGISTRY_REGISTRATION_PERMISSION } from "../constants/registration-permission.constant";

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
 * Creates application registration routes.
 *
 * @returns Registration route sub-application.
 */
export function createRegistrationRoutes(): Hono<{
  Bindings: RegistryBindings;
  Variables: RegistryVariables;
}> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  /**
   * Registers an application version and all declared metadata atomically.
   *
   * @security Requires a service principal with the registration permission
   * and registration audience.
   */
  router.post("/", async (c) => {
    const claims = c.get("registryClaims");

    if (
      claims.principal_type !== "service" ||
      typeof claims.sid !== "string" ||
      !claims.permissions?.includes(REGISTRY_REGISTRATION_PERMISSION) ||
      !hasAudience(claims, c.env.REGISTRY_REGISTRATION_AUDIENCE)
    ) {
      return c.json(
        { error: "forbidden", reason: "service_registration_permission_required" },
        403,
      );
    }

    if (c.env.REGISTRATION_RATE_LIMITER) {
      const limit = await c.env.REGISTRATION_RATE_LIMITER.limit({
        key: claims.sub,
      });
      if (!limit.success) {
        return c.json({ error: "rate_limited" }, 429);
      }
    }

    const parsed = applicationManifestSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        {
          error: "invalid_manifest",
          issues: parsed.error.flatten(),
          requestId: c.req.header("x-request-id"),
        },
        400,
      );
    }

    const manifest = parsed.data;

    try {
      validateUpstreams(manifest.routes, c.env.REGISTRY_ALLOWED_UPSTREAM_SUFFIX);
    } catch (error) {
      return c.json(
        {
          error: "invalid_upstream",
          message: error instanceof Error ? error.message : "invalid upstream",
        },
        400,
      );
    }

    const registrationKey = `${manifest.slug}:${manifest.version}`;
    const serializedManifest = JSON.stringify(manifest);
    const contentHash = await sha256(serializedManifest);
    const now = new Date().toISOString();

    const existingRegistration = await c.env.DB.prepare(
      "SELECT id FROM registrations WHERE registration_key = ?",
    )
      .bind(registrationKey)
      .first<{ id: string }>();

    if (existingRegistration) {
      return c.json({ error: "registration_exists", id: existingRegistration.id }, 409);
    }

    const existingApplication = await c.env.DB.prepare("SELECT id FROM applications WHERE slug = ?")
      .bind(manifest.slug)
      .first<{ id: string }>();

    const applicationId = existingApplication?.id ?? crypto.randomUUID();
    const versionId = crypto.randomUUID();

    const statements: D1PreparedStatement[] = [];

    if (!existingApplication) {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO applications
            (id, slug, display_name, description, status, current_version,
             branding_json, metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
        ).bind(
          applicationId,
          manifest.slug,
          manifest.displayName,
          manifest.description ?? null,
          manifest.version,
          JSON.stringify(manifest.branding ?? {}),
          JSON.stringify(manifest.metadata ?? {}),
          now,
          now,
        ),
      );
    } else {
      statements.push(
        c.env.DB.prepare(
          `UPDATE applications
           SET display_name = ?, description = ?, current_version = ?,
               branding_json = ?, metadata_json = ?, updated_at = ?
           WHERE id = ?`,
        ).bind(
          manifest.displayName,
          manifest.description ?? null,
          manifest.version,
          JSON.stringify(manifest.branding ?? {}),
          JSON.stringify(manifest.metadata ?? {}),
          now,
          applicationId,
        ),
      );
    }

    statements.push(
      c.env.DB.prepare(
        `INSERT INTO application_versions
          (id, application_id, version, manifest_hash, manifest_json,
           status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      ).bind(versionId, applicationId, manifest.version, contentHash, serializedManifest, now),
      c.env.DB.prepare(
        `INSERT INTO registrations
          (id, application_id, registration_key, content_hash, actor_id,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        applicationId,
        registrationKey,
        contentHash,
        claims.sub,
        now,
        now,
      ),
    );

    statements.push(
      ...manifest.routes.map((route) =>
        c.env.DB.prepare(
          `INSERT INTO application_routes
            (id, application_id, version_id, method, path_pattern, upstream,
             audience, required_permission, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          route.method,
          route.pathPattern,
          route.upstream,
          route.audience,
          route.requiredPermission ?? null,
          JSON.stringify(route.metadata ?? {}),
          now,
        ),
      ),
      ...(manifest.capabilities ?? []).map((capability) =>
        c.env.DB.prepare(
          `INSERT INTO application_capabilities
            (id, application_id, version_id, capability, config_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(crypto.randomUUID(), applicationId, versionId, capability, "{}", now),
      ),
      ...(manifest.modules ?? []).map((module) =>
        c.env.DB.prepare(
          `INSERT INTO application_modules
            (id, application_id, version_id, module_key, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          String(module.key ?? module.name ?? crypto.randomUUID()),
          JSON.stringify(module),
          now,
        ),
      ),
      ...(manifest.resources ?? []).map((resource) =>
        c.env.DB.prepare(
          `INSERT INTO application_resources
            (id, application_id, version_id, module_key, resource_key,
             metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          resource.moduleKey ? String(resource.moduleKey) : null,
          String(resource.key ?? resource.name ?? crypto.randomUUID()),
          JSON.stringify(resource),
          now,
        ),
      ),
      ...(manifest.navigation ?? []).map((navigation) =>
        c.env.DB.prepare(
          `INSERT INTO application_navigation
            (id, application_id, version_id, navigation_key, path, label, icon,
             required_permission, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          navigation.key,
          navigation.path,
          navigation.label ?? null,
          navigation.icon ?? null,
          navigation.permission ?? null,
          JSON.stringify(navigation.metadata ?? {}),
          now,
        ),
      ),
      ...(manifest.actions ?? []).map((action) =>
        c.env.DB.prepare(
          `INSERT INTO application_actions
            (id, application_id, version_id, resource_key, action_key,
             permission, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          action.resourceKey ? String(action.resourceKey) : null,
          String(action.key ?? action.name ?? crypto.randomUUID()),
          action.permission ? String(action.permission) : null,
          JSON.stringify(action),
          now,
        ),
      ),
      ...(manifest.environments ?? []).map((environment) =>
        c.env.DB.prepare(
          `INSERT INTO application_environments
            (id, application_id, environment, deployment_url,
             metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(application_id, environment) DO UPDATE SET
             deployment_url = excluded.deployment_url,
             metadata_json = excluded.metadata_json,
             updated_at = excluded.updated_at`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          String(environment.name ?? environment.environment ?? "unknown"),
          environment.url ? String(environment.url) : null,
          JSON.stringify(environment),
          now,
          now,
        ),
      ),
      ...[
        ...(manifest.eventDefinitions ?? []).map((item) => ({ category: "event", item })),
        ...(manifest.workflowDefinitions ?? []).map((item) => ({ category: "workflow", item })),
        ...(manifest.integrations ?? []).map((item) => ({ category: "integration", item })),
        ...(manifest.settings ?? []).map((item) => ({ category: "setting", item })),
        ...(manifest.features ?? []).map((item) => ({ category: "feature", item })),
        ...(manifest.widgets ?? []).map((item) => ({ category: "widget", item })),
        ...(manifest.localization ?? []).map((item) => ({ category: "localization", item })),
      ].map(({ category, item }) =>
        c.env.DB.prepare(
          `INSERT INTO application_catalog_items
            (id, application_id, version_id, category, item_key, payload_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          applicationId,
          versionId,
          category,
          String(
            (item as { key?: string; namespace?: string }).key ??
              (item as { key?: string; namespace?: string }).namespace ??
              crypto.randomUUID(),
          ),
          JSON.stringify(item),
          now,
        ),
      ),
      c.env.DB.prepare(
        `INSERT INTO audit_log
          (id, action, application_id, actor_id, correlation_id,
           payload_json, created_at)
         VALUES (?, 'application.registered', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        applicationId,
        claims.sub,
        c.req.header("x-request-id") ?? crypto.randomUUID(),
        JSON.stringify({
          slug: manifest.slug,
          version: manifest.version,
          contentHash,
        }),
        now,
      ),
    );

    await c.env.DB.batch(statements);
    await invalidateRegistryCache(c.env, manifest.slug);

    return c.json(
      {
        id: applicationId,
        slug: manifest.slug,
        version: manifest.version,
        contentHash,
      },
      201,
    );
  });

  /** Returns the current application metadata. */

  return router;
}
