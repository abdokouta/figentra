import type { WorkflowStep } from 'cloudflare:workers';

/** Input accepted by the generic workflow runtime. */
export interface WorkflowInvocation {
  workflow: string;
  version?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

/** Native durable workflow handler registered into this Worker bundle. */
export interface WorkflowHandler {
  key: string;
  version: string;
  run(input: WorkflowInvocation, step: WorkflowStep): Promise<unknown>;
}
