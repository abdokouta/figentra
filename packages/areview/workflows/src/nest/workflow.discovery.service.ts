import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import 'reflect-metadata';
import {
  WORKFLOW_HOOK_METADATA,
  WORKFLOW_METADATA,
  WORKFLOW_STEP_METADATA,
  type WorkflowClassMetadata,
  type WorkflowHookMetadata,
  type WorkflowStepMetadata,
} from '../decorators/index.js';
import type { WorkflowDefinition, WorkflowHookDefinition, WorkflowContext } from '../contracts/index.js';

export interface DiscoveredWorkflowClass {
  type: Function;
  metadata: WorkflowClassMetadata;
  steps: Array<WorkflowStepMetadata & { method: string | symbol }>;
  hooks: WorkflowHookMetadata[];
}

/** Discovers workflow declarations from Nest providers/controllers. */
@Injectable()
export class WorkflowDiscoveryService {
  constructor(private readonly discovery: DiscoveryService) {}

  collect(): DiscoveredWorkflowClass[] {
    const result: DiscoveredWorkflowClass[] = [];
    for (const wrapper of [...this.discovery.getProviders(), ...this.discovery.getControllers()]) {
      const type = wrapper.metatype;
      if (!type) continue;
      const metadata = Reflect.getMetadata(WORKFLOW_METADATA, type) as WorkflowClassMetadata | undefined;
      if (!metadata) continue;

      const prototype = type.prototype;
      const steps: DiscoveredWorkflowClass['steps'] = [];
      for (const name of Object.getOwnPropertyNames(prototype)) {
        if (name === 'constructor') continue;
        const step = Reflect.getMetadata(WORKFLOW_STEP_METADATA, prototype, name) as WorkflowStepMetadata | undefined;
        if (step) steps.push({ ...step, method: name });
      }

      const hooks = (Reflect.getMetadata(WORKFLOW_HOOK_METADATA, type) ?? []) as WorkflowHookMetadata[];
      result.push({ type, metadata, steps, hooks });
    }
    return result;
  }

  /** Compiles one discovered Nest instance into framework-neutral metadata plus executable methods. */
  compile<TInput = unknown, TContext = WorkflowContext>(instance: object): WorkflowDefinition<TInput, TContext> {
    const type = instance.constructor;
    const discovered = this.collect().find((item) => item.type === type);
    if (!discovered) throw new Error(`Workflow metadata not found for ${type.name}`);

    const hooksByStep = new Map<string, WorkflowHookMetadata[]>();
    for (const hook of discovered.hooks) {
      const hooks = hooksByStep.get(hook.step) ?? [];
      hooks.push(hook);
      hooksByStep.set(hook.step, hooks);
    }

    const steps = discovered.steps.map((step) => {
      const hooks: WorkflowHookDefinition<TContext>[] = (hooksByStep.get(step.name) ?? []).map((hook) => ({
        type: hook.type,
        name: String(hook.method),
        execute: async (context, result, error) => {
          const method = (instance as Record<string, (...args: unknown[]) => unknown>)[String(hook.method)];
          return await method.call(instance, context, result, error);
        },
      }));

      const compensate = step.compensateMethod
        ? async (context: TContext, result?: unknown) => {
            const method = (instance as Record<string, (...args: unknown[]) => unknown>)[step.compensateMethod!];
            await method.call(instance, context, result);
          }
        : hooks.find((hook) => hook.type === 'compensate')?.execute;

      return {
        name: step.name,
        retry: step.retry,
        hooks,
        compensate,
        execute: async (context: TContext) => {
          const method = (instance as Record<string, (...args: unknown[]) => unknown>)[String(step.method)];
          return await method.call(instance, context);
        },
      };
    });

    return {
      name: discovered.metadata.name,
      version: discovered.metadata.version,
      steps,
      metadata: { ...discovered.metadata },
    };
  }
}
