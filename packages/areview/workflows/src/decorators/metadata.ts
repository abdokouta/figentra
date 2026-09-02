import 'reflect-metadata';
import type { WorkflowRetryPolicy } from '../contracts/workflow.types.js';

/** Reflection key for workflow class metadata. */
export const WORKFLOW_METADATA = Symbol.for('figentra:workflow');
/** Reflection key for workflow step metadata. */
export const WORKFLOW_STEP_METADATA = Symbol.for('figentra:workflow:step');
/** Reflection key for workflow step-hook metadata. */
export const WORKFLOW_HOOK_METADATA = Symbol.for('figentra:workflow:step-hook');

/** Supported step-local lifecycle hook phases. */
export type WorkflowHookType = 'before' | 'after' | 'onError' | 'compensate';

/** Workflow class metadata. */
export interface WorkflowClassMetadata {
  name: string;
  version?: string;
  description?: string;
  runtime?: 'cloudflare-workflow';
  worker?: string;
  binding?: string;
  trigger?: Record<string, unknown>;
  permissions?: string[];
}

/** Workflow step metadata. */
export interface WorkflowStepMetadata {
  name: string;
  retry?: WorkflowRetryPolicy;
  compensateMethod?: string;
}

/** Step-local lifecycle hook metadata. */
export interface WorkflowHookMetadata {
  type: WorkflowHookType;
  step: string;
  method: string | symbol;
}
