/**
 * @file infrastructure.workflow.ts
 * @description Durable Terraform workflow composed from @figentra/workflows.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { CloudflareWorkflowAdapter, createStep, createWorkflow, response, type StepContext } from '@figentra/workflows';
import type { OrchestratorBindings } from '../interfaces/orchestrator-bindings.interface';
import type { TerraformWorkflowInput } from '../interfaces/terraform-workflow-input.interface';
import { executeTerraformJob } from '../services/runner.service';
import { markJobFailed, markJobFinished, markJobRunning } from '../services/job.service';

const RETRY = { retries: { limit: 3, delay: '15 seconds', backoff: 'exponential' as const }, timeout: '60 minutes' };
type InfrastructureContext = StepContext<TerraformWorkflowInput> & { env: OrchestratorBindings };
type TerraformResult = Awaited<ReturnType<typeof executeTerraformJob>>;

const markRunning = createStep<TerraformWorkflowInput, void, InfrastructureContext>('mark-running', async (_input, context) => markJobRunning(context.env, context.input.jobId), { retry: RETRY });
const terraformExecution = createStep<TerraformWorkflowInput, TerraformResult, InfrastructureContext>('terraform-execution', async (_input, context) => executeTerraformJob(context.env, context.input), { retry: RETRY });
const recordResult = createStep<TerraformWorkflowInput, void, InfrastructureContext>('record-result', async (_input, context) => {
  const result = context.results.at(-1) as TerraformResult | undefined;
  if (!result) throw new Error('Terraform execution result is missing.');
  await markJobFinished(context.env, context.input.jobId, result.exitCode === 0 ? 'succeeded' : 'failed', result.exitCode, result.stdout, result.stderr);
}, { retry: RETRY });

export const infrastructureWorkflow = createWorkflow<TerraformWorkflowInput, void, InfrastructureContext>('infrastructure.terraform', [markRunning, terraformExecution, recordResult], () => response(undefined), { version: '1', metadata: { domain: 'infrastructure', runtime: 'cloudflare-workflows' } });

export class InfrastructureWorkflow extends WorkflowEntrypoint<OrchestratorBindings, TerraformWorkflowInput> {
  async run(event: WorkflowEvent<TerraformWorkflowInput>, step: WorkflowStep): Promise<void> {
    const input = event.payload;
    const context: InfrastructureContext = { executionId: input.jobId, input, env: this.env, metadata: undefined, results: [] };
    const adapter = new CloudflareWorkflowAdapter();
    try {
      await adapter.execute(infrastructureWorkflow.definition, input, context, step);
    } catch (error) {
      await step.do('record-workflow-failure', RETRY, () => markJobFailed(this.env, input.jobId, error));
      throw error;
    }
  }
}
