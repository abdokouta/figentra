import type { WorkflowContext, WorkflowDefinition, WorkflowExecution, WorkflowRetryPolicy, WorkflowStepDefinition } from '../contracts/index.js';

export interface CloudflareWorkflowStep {
  do<T>(name: string, config: WorkflowRetryPolicy | undefined, callback: () => Promise<T>): Promise<T>;
  sleep(name: string, duration: string | number): Promise<void>;
  sleepUntil(name: string, timestamp: number | Date): Promise<void>;
}

/** Executes framework-neutral definitions using native Cloudflare durable step boundaries. */
export class CloudflareWorkflowAdapter {
  async execute<TInput, TContext extends WorkflowContext<TInput>>(
    definition: WorkflowDefinition<TInput, TContext>,
    _input: TInput,
    context: TContext,
    step: CloudflareWorkflowStep,
  ): Promise<unknown> {
    const completed: Array<{ definition: WorkflowStepDefinition<TContext, unknown>; result: unknown }> = [];
    context.results = [];

    try {
      for (const workflowStep of definition.steps) {
        for (const hook of workflowStep.hooks ?? []) {
          if (hook.type !== 'before') continue;
          await step.do(`${workflowStep.name}:before:${hook.name}`, workflowStep.retry, () => Promise.resolve(hook.execute(context)));
        }

        try {
          const result = await step.do(workflowStep.name, workflowStep.retry, () => Promise.resolve(workflowStep.execute(context)));
          context.results.push(result);
          completed.push({ definition: workflowStep, result });

          for (const hook of workflowStep.hooks ?? []) {
            if (hook.type !== 'after') continue;
            await step.do(`${workflowStep.name}:after:${hook.name}`, workflowStep.retry, () => Promise.resolve(hook.execute(context, result)));
          }
        } catch (error) {
          for (const hook of workflowStep.hooks ?? []) {
            if (hook.type !== 'onError') continue;
            await step.do(`${workflowStep.name}:error:${hook.name}`, workflowStep.retry, () => Promise.resolve(hook.execute(context, undefined, error)));
          }
          throw error;
        }
      }
      return { workflow: definition.name, version: definition.version, results: [...context.results] };
    } catch (error) {
      for (const item of [...completed].reverse()) {
        for (const hook of item.definition.hooks ?? []) {
          if (hook.type !== 'compensate') continue;
          await step.do(`${item.definition.name}:compensate:${hook.name}`, undefined, () => Promise.resolve(hook.execute(context, item.result, error)));
        }
        if (item.definition.compensate) {
          await step.do(`${item.definition.name}:compensate`, undefined, () => Promise.resolve(item.definition.compensate!(context, item.result)));
        }
      }
      throw error;
    }
  }

  execution(workflow: string, id: string, version?: string): WorkflowExecution {
    return { id, workflow, version, provider: 'cloudflare', status: 'succeeded' };
  }
}
