/**
 * @file jobs.route.ts
 * @description Infrastructure job HTTP contract.
 */
import { Hono } from "hono";
import type { OrchestratorBindings } from "../interfaces/orchestrator-bindings.interface";
import type { OrchestratorVariables } from "../interfaces/orchestrator-variables.interface";
import type { TerraformWorkflowInput } from "../interfaces/terraform-workflow-input.interface";
import { terraformJobSchema } from "../schemas/terraform-job.schema";
import { createJob } from "../services/job.service";

/**
 * Creates infrastructure job routes.
 *
 * @returns Job route sub-application.
 */
export function createJobRoutes(): Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }> {
  const router = new Hono<{ Bindings: OrchestratorBindings; Variables: OrchestratorVariables }>();

  /**
   * Queues an authorized infrastructure operation.
   *
   * @security Production mutations require an approval/change reference.
   *
   * @param c - Hono request context.
   */
  router.post("/", async (c) => {
    const principal = c.get("principal");

    const parsed = terraformJobSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: 'invalid_request', issues: parsed.error.flatten() }, 400);

    const requiredPermission = parsed.data.operation === 'plan' ? c.env.PLAN_PERMISSION : parsed.data.operation === 'destroy' ? c.env.DESTROY_PERMISSION : c.env.APPLY_PERMISSION;
    if (!principal.permissions?.includes(requiredPermission)) return c.json({ error: 'forbidden' }, 403);

    if (parsed.data.environment !== 'development' && parsed.data.operation !== 'plan' && !parsed.data.approvalRef) {
      return c.json({ error: 'approval_required', message: 'Staging and production mutations require a change/approval reference.' }, 409);
    }

    const active = await c.env.DB.prepare(
      `SELECT id FROM infrastructure_jobs WHERE environment = ? AND status IN ('queued','running') LIMIT 1`,
    ).bind(parsed.data.environment).first<{ id: string }>();
    if (active) return c.json({ error: 'environment_locked', jobId: active.id }, 409);

    const jobId = await createJob(c.env, { ...parsed.data, actorId: principal.sub });
    const workflowInput: TerraformWorkflowInput = { jobId, ...parsed.data };
    const instance = await c.env.INFRA_WORKFLOW.create({ id: jobId, params: workflowInput });
    return c.json({ id: jobId, workflowId: instance.id, status: 'queued' }, 202);
  });

  /**
   * Returns the current execution state of an infrastructure job.
   */

  /**
   * Returns the current state of an infrastructure job.
   *
   * @param c - Hono request context.
   */
  router.get("/:id", async (c) => {
    const principal = c.get("principal");
    if (!principal.permissions?.includes('infrastructure:terraform:read')) return c.json({ error: 'forbidden' }, 403);
    const row = await c.env.DB.prepare('SELECT id, environment, operation, revision, workspace, status, exit_code, created_at, updated_at FROM infrastructure_jobs WHERE id = ?').bind(c.req.param('id')).first();
    if (!row) return c.json({ error: 'not_found' }, 404);
    return c.json(row);
  });


  return router;
}
