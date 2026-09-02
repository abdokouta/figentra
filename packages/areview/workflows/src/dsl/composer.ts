import type { WorkflowRetryPolicy } from '../contracts/workflow.types.js';
import type { HookDefinition, StepContext, StepDefinition, ComposedWorkflowBuilder, ComposedWorkflowDefinition, WorkflowResponse, StepResponse } from './types.js';

export function createStep<TInput = unknown, TResult = unknown, TContext extends StepContext<TInput> = StepContext<TInput>>(name: string, execute: StepDefinition<TInput, TResult, TContext>['execute'], options: { retry?: WorkflowRetryPolicy; compensate?: StepDefinition<TInput, TResult, TContext>['compensate'] } = {}): StepDefinition<TInput, TResult, TContext> {
  if (!name.trim()) throw new Error('Workflow step name cannot be empty.');
  return { kind: 'step', name, execute, retry: options.retry, compensate: options.compensate };
}

/** Hooks are composition metadata. Durable side effects should remain explicit steps. */
export function createHook<TContext = StepContext>(name: string, execute: HookDefinition<TContext>['execute']): HookDefinition<TContext> {
  if (!name.trim()) throw new Error('Workflow hook name cannot be empty.');
  return { kind: 'hook', name, execute };
}

export function createWorkflow<TInput = unknown, TResult = unknown>(name: string, steps: readonly StepDefinition<any, any>[], compose: (results: readonly unknown[], input: TInput, context: StepContext<TInput>) => TResult | Promise<TResult>, options: { version?: string; metadata?: Record<string, unknown> } = {}): ComposedWorkflowBuilder<TInput, TResult> {
  if (!name.trim()) throw new Error('Workflow name cannot be empty.');
  const definition: ComposedWorkflowDefinition<TInput, TResult> = {
    name, version: options.version ?? '1', metadata: options.metadata, steps,
    run: async (input, context) => {
      const results: unknown[] = [];
      const completed: Array<{ step: StepDefinition; result: unknown }> = [];
      try {
        for (const step of steps) {
          const result = await step.execute(input, context);
          results.push(result);
          completed.push({ step, result });
        }
        return await compose(results, input, context);
      } catch (error) {
        for (const item of [...completed].reverse()) {
          if (item.step.compensate) await item.step.compensate(input, item.result, context);
        }
        throw error;
      }
    },
  };
  return { definition, run: definition.run };
}

export function response<T>(value: T): WorkflowResponse<T> { return { value }; }
export function stepResponse<T>(value: T, compensate?: () => void | Promise<void>): StepResponse<T> { return { value, compensate }; }
export function transform<TInput, TResult>(value: TInput, mapper: (value: TInput) => TResult): TResult { return mapper(value); }
export async function parallelize<T>(tasks: readonly (() => T | Promise<T>)[]): Promise<T[]> { return Promise.all(tasks.map((task) => task())); }
export function when<T>(condition: boolean | ((value: T) => boolean), value: T, thenValue: T, elseValue: T): T { return (typeof condition === 'function' ? condition(value) : condition) ? thenValue : elseValue; }
