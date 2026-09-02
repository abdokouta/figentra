/** Provider-neutral durable workflow contracts. */
export type WorkflowExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'terminated' | 'paused';

export type WorkflowProviderKind = 'cloudflare' | 'temporal' | 'vercel' | 'custom';

export interface WorkflowRetryPolicy {
  limit?: number;
  delay?: string | number;
  backoff?: 'constant' | 'linear' | 'exponential';
  timeout?: string | number;
}

export interface WorkflowExecution {
  id: string;
  workflow: string;
  version?: string;
  provider: WorkflowProviderKind;
  status: WorkflowExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStartRequest<TPayload = unknown> {
  workflow: string;
  version?: string;
  payload: TPayload;
  id?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowSignalRequest<TPayload = unknown> {
  executionId: string;
  signal: string;
  payload?: TPayload;
}

export interface WorkflowProviderCapabilities {
  pause?: boolean;
  resume?: boolean;
  signal?: boolean;
  cancel?: boolean;
  terminate?: boolean;
  waitForEvent?: boolean;
}

export interface WorkflowProvider {
  readonly kind: WorkflowProviderKind;
  readonly capabilities: WorkflowProviderCapabilities;
  start<TPayload = unknown>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution>;
  get(executionId: string): Promise<WorkflowExecution | undefined>;
  signal?<TPayload = unknown>(request: WorkflowSignalRequest<TPayload>): Promise<void>;
  cancel?(executionId: string): Promise<void>;
  terminate?(executionId: string): Promise<void>;
  pause?(executionId: string): Promise<void>;
  resume?(executionId: string): Promise<void>;
}

export interface WorkflowContext<TInput = unknown> {
  executionId: string;
  input: TInput;
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface WorkflowStepDefinition<TContext = WorkflowContext, TResult = unknown> {
  name: string;
  execute: (context: TContext) => Promise<TResult> | TResult;
  retry?: WorkflowRetryPolicy;
  compensate?: (context: TContext, result?: TResult) => Promise<void> | void;
}

export interface WorkflowDefinition<TInput = unknown, TContext = WorkflowContext<TInput>> {
  name: string;
  version: string;
  steps: readonly WorkflowStepDefinition<TContext, unknown>[];
  metadata?: Record<string, unknown>;
}
