import type { WorkflowRetryPolicy } from '../contracts/workflow.types.js';

export const WORKFLOW_METADATA = Symbol.for('figentra:workflow');
export const WORKFLOW_STEP_METADATA = Symbol.for('figentra:workflow:step');

export interface WorkflowClassMetadata {
  name: string;
  version?: string;
  description?: string;
  runtime?: 'cloudflare-workflow' | 'temporal' | 'vercel' | 'custom';
  worker?: string;
  binding?: string;
  trigger?: Record<string, unknown>;
  permissions?: string[];
}
export interface WorkflowStepMetadata { name: string; retry?: WorkflowRetryPolicy; compensateMethod?: string; }
