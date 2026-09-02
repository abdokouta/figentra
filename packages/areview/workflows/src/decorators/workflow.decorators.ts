import 'reflect-metadata';
import type { WorkflowRetryPolicy } from '../contracts/workflow.types.js';
import { WORKFLOW_METADATA, WORKFLOW_STEP_METADATA, type WorkflowClassMetadata, type WorkflowStepMetadata } from './metadata.js';

export function Workflow(name: string, options: Omit<WorkflowClassMetadata, 'name'> = {}): ClassDecorator {
  if (!name.trim()) throw new Error('Workflow name cannot be empty.');
  return (target) => Reflect.defineMetadata(WORKFLOW_METADATA, { name, ...options }, target);
}

export function Step(name: string, options: { retry?: WorkflowRetryPolicy; compensateMethod?: string } = {}): MethodDecorator {
  if (!name.trim()) throw new Error('Workflow step name cannot be empty.');
  return (target, propertyKey) => Reflect.defineMetadata(WORKFLOW_STEP_METADATA, { name, ...options } satisfies WorkflowStepMetadata, target, propertyKey);
}
