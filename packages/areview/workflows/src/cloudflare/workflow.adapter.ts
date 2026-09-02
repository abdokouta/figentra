import type { WorkflowDefinition, WorkflowExecution, WorkflowRetryPolicy } from '../contracts/index.js';

export interface CloudflareWorkflowStep {
  do<T>(name: string, config: WorkflowRetryPolicy | undefined, callback: (context?: unknown) => Promise<T>): Promise<T>;
  sleep(name: string, duration: string | number): Promise<void>;
  sleepUntil(name: string, timestamp: number | Date): Promise<void>;
}

/** Executes the framework-neutral definition using native Cloudflare durable step boundaries. */
export class CloudflareWorkflowAdapter {
  async execute<TInput, TContext>(definition: WorkflowDefinition<TInput, TContext>, input: TInput, context: TContext, step: CloudflareWorkflowStep): Promise<unknown> {
    const results: unknown[] = [];
    const completed: Array<{ name: string; result: unknown; compensate?: (context: TContext, result?: unknown) => Promise<void> | void }> = [];
    try {
      for (const workflowStep of definition.steps) {
        const result = await step.do(workflowStep.name, workflowStep.retry, () => workflowStep.execute(context));
        results.push(result);
        completed.push({ name: workflowStep.name, result, compensate: workflowStep.compensate });
      }
      return { workflow: definition.name, version: definition.version, input, results };
    } catch (error) {
      for (const item of [...completed].reverse()) {
        if (item.compensate) await step.do(`${item.name}:compensate`, undefined, () => item.compensate!(context, item.result));
      }
      throw error;
    }
  }

  execution(workflow: string, id: string): WorkflowExecution { return { id, workflow, provider: 'cloudflare', status: 'succeeded' }; }
}
