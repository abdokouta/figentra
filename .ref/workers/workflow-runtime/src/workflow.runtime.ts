import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { WorkflowInvocation } from './workflow.types';
import { resolveWorkflow } from './workflow.registry';

/** Generic Cloudflare durable workflow runtime. The engine is Cloudflare; this class only dispatches registered code. */
export class FigentraWorkflowRuntime extends WorkflowEntrypoint<Env, WorkflowInvocation> {
  override async run(event: WorkflowEvent<WorkflowInvocation>, step: WorkflowStep): Promise<unknown> {
    const input = event.payload;
    const handler = resolveWorkflow(input.workflow, input.version);
    if (!handler) throw new Error(`Workflow not registered: ${input.workflow}${input.version ? `@${input.version}` : ''}`);
    return handler.run(input, step);
  }
}
