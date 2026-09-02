/**
 * @file infrastructure.workflow.ts
 * @description Durable Terraform workflow composed from @figentra/workflows.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { createStep, createWorkflow, response, CloudflareWorkflowAdapter, type StepContext } from '@figentra/workflows';
import type { OrchestratorBindings } from '../interfaces/orchestrator-bindings.interface.js';
import type { TerraformWorkflowInput } from '../interfaces/terraform-workflow-input.interface.js';
import { executeTerraformJob } from '../services/runner.service.js';
import { markJobFailed, markJobFinished, markJobRunning } from '../services/job.service.js';

const RETRY = { retries: { limit: 3, delay: '15 seconds', backoff: 'exponential' as const }, timeout: '60 minutes' };
type InfrastructureContext = StepContext<TerraformWorkflowInput> & { env: OrchestratorBindings };

const markRunning = createStep<TerraformWorkflowInput, void>('mark-running', async (_input, context:InfrastructureContext) => markJobRunning(context.env, context.input.jobId), { retry: RETRY });
const terraformExecution = createStep<TerraformWorkflowInput, Awaited<ReturnType<typeof executeTerraformJob>>>('terraform-execution', async (_input, context:InfrastructureContext) => { const result=await executeTerraformJob(context.env, context.input); context.metadata={...context.metadata,terraformResult:result}; return result; }, { retry: RETRY });
const recordResult = createStep<TerraformWorkflowInput, void>('record-result', async (_input, context:InfrastructureContext) => { const result=context.metadata?.terraformResult as Awaited<ReturnType<typeof executeTerraformJob>>; await markJobFinished(context.env, context.input.jobId, result.exitCode===0?'succeeded':'failed',result.exitCode,result.stdout,result.stderr); }, { retry: RETRY });

export const infrastructureWorkflow = createWorkflow<TerraformWorkflowInput, unknown>('infrastructure.terraform', [markRunning, terraformExecution, recordResult], (results) => response(results[results.length-1]), { version:'1', metadata:{ domain:'infrastructure', runtime:'cloudflare-workflows' } });

export class InfrastructureWorkflow extends WorkflowEntrypoint<OrchestratorBindings, TerraformWorkflowInput> {
  async run(event:WorkflowEvent<TerraformWorkflowInput>, step:WorkflowStep):Promise<void>{
    const input=event.payload;
    const context:InfrastructureContext={executionId:input.jobId,input,env:this.env,metadata:{}};
    const adapter=new CloudflareWorkflowAdapter();
    try {
      await adapter.execute(infrastructureWorkflow.definition, input, context, step);
    } catch(error){
      await step.do('record-workflow-failure',RETRY,()=>markJobFailed(this.env,input.jobId,error));
      throw error;
    }
  }
}
