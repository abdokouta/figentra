import { Hono } from 'hono';
import type { WorkflowRuntimeEnv } from './env.types';
import { verifyWorkflowToken } from './security';
import type { WorkflowInvocation } from './workflow.types';
import { workflowInvocationSchema } from './workflow.schema';

/** Creates the authenticated workflow invocation API. */
export function createWorkflowRuntimeApp(): Hono<{ Bindings: WorkflowRuntimeEnv }> {
  const app = new Hono<{ Bindings: WorkflowRuntimeEnv }>();

  app.get('/health/live', (c) => c.json({ status: 'ok' }));

  app.post('/v1/workflows/start', async (c) => {
    let claims;
    try {
      claims = await verifyWorkflowToken(c.req.raw, c.env);
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }

    if (
      claims.principal_type !== 'service' ||
      !claims.permissions?.includes(c.env.WORKFLOW_EXECUTE_PERMISSION)
    ) {
      return c.json({ error: 'forbidden' }, 403);
    }

    const parsed = workflowInvocationSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: 'invalid_workflow_request', issues: parsed.error.flatten() }, 400);
    const body = parsed.data as WorkflowInvocation & { id?: string };

    const instance = await c.env.WORKFLOW_RUNTIME.create({
      ...(body.id ? { id: body.id } : {}),
      params: {
        workflow: body.workflow,
        version: body.version,
        payload: body.payload,
        metadata: {
          ...(body.metadata ?? {}),
          caller: claims.sub,
        },
      },
    });

    return c.json({ id: instance.id, workflow: body.workflow, version: body.version }, 202);
  });

  return app;
}
