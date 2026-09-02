import 'reflect-metadata';
import type { WorkflowRetryPolicy } from '../contracts/workflow.types.js';
import {
  WORKFLOW_HOOK_METADATA,
  WORKFLOW_METADATA,
  WORKFLOW_STEP_METADATA,
  type WorkflowClassMetadata,
  type WorkflowHookMetadata,
  type WorkflowHookType,
  type WorkflowStepMetadata,
} from './metadata.js';

/** Declares a workflow class for discovery and compilation. */
export function Workflow(name: string, options: Omit<WorkflowClassMetadata, 'name'> = {}): ClassDecorator {
  return (target) => Reflect.defineMetadata(WORKFLOW_METADATA, { name, ...options }, target);
}

/** Declares a durable workflow step. */
export function Step(
  name: string,
  options: { retry?: WorkflowRetryPolicy; compensateMethod?: string } = {},
): MethodDecorator {
  return (target, propertyKey) => Reflect.defineMetadata(
    WORKFLOW_STEP_METADATA,
    { name, ...options } satisfies WorkflowStepMetadata,
    target,
    propertyKey,
  );
}

/** Declares a durable hook attached to a specific workflow step. */
export function WorkflowHook(type: WorkflowHookType, step: string): MethodDecorator {
  if (!step) throw new Error('Workflow step hook requires a target step name.');

  return (target, propertyKey) => {
    const existing = (Reflect.getMetadata(WORKFLOW_HOOK_METADATA, target.constructor) ?? []) as WorkflowHookMetadata[];
    Reflect.defineMetadata(
      WORKFLOW_HOOK_METADATA,
      [...existing, { type, step, method: propertyKey }],
      target.constructor,
    );
  };
}

/** Runs as a durable step immediately before the target step. */
export const Before = (step: string): MethodDecorator => WorkflowHook('before', step);
/** Runs as a durable step immediately after the target step. */
export const After = (step: string): MethodDecorator => WorkflowHook('after', step);
/** Runs as a durable error-handling step for the target step. */
export const OnWorkflowError = (step: string): MethodDecorator => WorkflowHook('onError', step);
/** Runs as a durable compensation step for the target step. */
export const Compensate = (step: string): MethodDecorator => WorkflowHook('compensate', step);
/** Explicit alias for compensation semantics. */
export const CompensationFor = (step: string): MethodDecorator => WorkflowHook('compensate', step);
