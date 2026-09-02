import type { WorkflowRetryPolicy, WorkflowContext, WorkflowDefinition } from '../contracts/workflow.types.js';

export interface StepContext<TInput = unknown> extends WorkflowContext<TInput> {}

export interface StepDefinition<TInput = unknown, TResult = unknown, TContext extends StepContext<TInput> = StepContext<TInput>> {
  kind: 'step';
  name: string;
  execute: (input: TInput, context: TContext) => TResult | Promise<TResult>;
  compensate?: (input: TInput, result: TResult | undefined, context: TContext) => void | Promise<void>;
  retry?: WorkflowRetryPolicy;
}

export interface HookDefinition<TContext = StepContext> {
  kind: 'hook';
  name: string;
  execute: (context: TContext, value?: unknown, error?: unknown) => unknown | Promise<unknown>;
}

export interface ComposedWorkflowDefinition<TInput = unknown, TResult = unknown> extends Omit<WorkflowDefinition<TInput, StepContext<TInput>>, 'steps'> {
  steps: readonly StepDefinition<any, any>[];
  run: (input: TInput, context: StepContext<TInput>) => Promise<TResult>;
}

export interface ComposedWorkflowBuilder<TInput, TResult> {
  definition: ComposedWorkflowDefinition<TInput, TResult>;
  run(input: TInput, context: StepContext<TInput>): Promise<TResult>;
}

export interface WorkflowResponse<T> { value: T }
export interface StepResponse<T> { value: T; compensate?: () => void | Promise<void> }
