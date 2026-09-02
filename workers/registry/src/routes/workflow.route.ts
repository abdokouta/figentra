/**
 * @file workflow.route.ts
 * @description Workflow discovery endpoint backed by Registry catalog metadata.
 */
import { Hono } from 'hono';
import type { RegistryBindings } from '../interfaces/registry-bindings.interface.js';
import type { RegistryVariables } from '../interfaces/registry-variables.interface.js';
import { canReadRegistry } from '../security/registry-permission.js';

/** Creates workflow inventory routes. */
export function createWorkflowRoutes(): Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }> {
  const router = new Hono<{ Bindings: RegistryBindings; Variables: RegistryVariables }>();

  router.get('/', async (c) => {
    if (!canReadRegistry(c)) return c.json({ error: 'forbidden' }, 403);
    const application = c.req.query('application');
    const conditions = ["aci.category = 'workflow'", 'v.id = (SELECT current_v.id FROM application_versions current_v WHERE current_v.application_id = a.id AND current_v.version = a.current_version)'];
    const bindings: string[] = [];
    if (application) {
      conditions.push('a.slug = ?');
      bindings.push(application);
    }

    const result = await c.env.DB.prepare(
      `SELECT a.slug AS application, v.version, aci.item_key AS workflow, aci.payload_json AS definition, aci.created_at
       FROM application_catalog_items aci
       JOIN applications a ON a.id = aci.application_id
       JOIN application_versions v ON v.id = aci.version_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.slug, aci.item_key`,
    ).bind(...bindings).all();

    const workflows = result.results.map((row) => ({
      application: row.application,
      version: row.version,
      workflow: row.workflow,
      definition: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition,
      createdAt: row.created_at,
    }));

    return c.json({ count: workflows.length, workflows });
  });

  return router;
}
