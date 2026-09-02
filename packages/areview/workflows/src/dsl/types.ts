import type { WorkflowRetryPolicy, WorkflowContext, WorkflowDefinition } from '../contracts/workflow.types.js';

export interface StepContext<TInput = unknown> extends WorkflowContext<TInput> {}
export interface StepDefinition<TInput = unknown, TResult = unknown, TContext extends StepContext<TInput> = StepContext<TInput>> {
  readonly kind: 'step'; readonly name: string;
  readonly execute: (input: TInput, context: TContext) => TResult | Promise<TResult>;
  readonly compensate?: (input: TInput, result: TResult | undefined, context: TContext) => void | Promise<void>;
  readonly retry?: WorkflowRetryPolicy;
}
export interface HookDefinition<TContext = StepContext> { readonly kind: 'hook'; readonly name: string; readonly execute: (context: TContext, value?: unknown, error?: unknown) => unknown | Promise<unknown>; }
export interface ComposedWorkflowDefinition<TInput = unknown, TResult = unknown, TContext extends StepContext<TInput> = StepContext<TInput>> extends Omit<WorkflowDefinition<TInput, TContext>, 'steps'> { readonly steps: readonly StepDefinition<TInput, unknown, TContext>[]; readonly run: (input: TInput, context: TContext) => Promise<TResult>; }
export interface ComposedWorkflowBuilder<TInput, TResult, TContext extends StepContext<TInput> = StepContext<TInput>> { readonly definition: ComposedWorkflowDefinition<TInput, TResult, TContext>; readonly run: (input: TInput, context: TContext) => Promise<TResult>; }
export interface WorkflowResponse<T> { readonly value: T }
export interface StepResponse<T> { readonly value: T; readonly compensate?: () => void | Promise<void> }
