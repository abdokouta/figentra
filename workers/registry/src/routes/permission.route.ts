/**
 * @file permission.route.ts
 * @description Read-only query surface for permissions declared by an application.
 *
 * Registry is not the authorization authority. IAM/Policy remains authoritative
 * for whether a principal may exercise a permission; this endpoint only exposes
 * the permission strings declared by routes, actions, and navigation metadata.
 */
import { Hono } from 'hono';
import type { RegistryBindings } from '../interfaces/registry-bindings.interface.js';
import type { RegistryVariables } from '../interfaces/registry-variables.interface.js';
import { canReadRegistry } from '../security/registry-permission.js';

/** Creates the permission metadata query routes. */
export function createPermissionRoutes(): Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  router.get('/', async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: 'forbidden' }, 403);

    const application = c.req.query('application');
    const version = c.req.query('version');
    const conditions: string[] = [];
    const bindings: string[] = [];

    if (application) {
      conditions.push('a.slug = ?');
      bindings.push(application);
    }

    if (version) {
      conditions.push('v.version = ?');
      bindings.push(version);
    } else {
      conditions.push('v.id = (SELECT current_v.id FROM application_versions current_v WHERE current_v.application_id = a.id AND current_v.version = a.current_version)');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [actions, navigation, routes] = await Promise.all([
      c.env.DB.prepare(`SELECT a.slug AS application, v.version, aa.permission AS permission FROM application_actions aa JOIN applications a ON a.id = aa.application_id JOIN application_versions v ON v.id = aa.version_id ${where} AND aa.permission IS NOT NULL`).bind(...bindings).all(),
      c.env.DB.prepare(`SELECT a.slug AS application, v.version, an.required_permission AS permission FROM application_navigation an JOIN applications a ON a.id = an.application_id JOIN application_versions v ON v.id = an.version_id ${where} AND an.required_permission IS NOT NULL`).bind(...bindings).all(),
      c.env.DB.prepare(`SELECT a.slug AS application, v.version, ar.required_permission AS permission FROM application_routes ar JOIN applications a ON a.id = ar.application_id JOIN application_versions v ON v.id = ar.version_id ${where} AND ar.required_permission IS NOT NULL`).bind(...bindings).all(),
    ]);

    const seen = new Set<string>();
    const permissions = [...actions.results, ...navigation.results, ...routes.results]
      .map((row) => ({ application: row.application, version: row.version, permission: row.permission }))
      .filter((row) => typeof row.permission === 'string' && !seen.has(`${row.application}:${row.version}:${row.permission}`))
      .filter((row) => {
        const key = `${row.application}:${row.version}:${row.permission}`;
        seen.add(key);
        return true;
      });

    return c.json({
      count: permissions.length,
      permissions,
      authority: 'iam-policy',
    });
  });

  return router;
}
