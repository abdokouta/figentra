import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import 'reflect-metadata';
import { WORKFLOW_METADATA, WORKFLOW_STEP_METADATA, type WorkflowClassMetadata, type WorkflowStepMetadata } from '../decorators/index.js';
import type { WorkflowDefinition, WorkflowContext } from '../contracts/index.js';

export interface DiscoveredWorkflowClass { type: Function; metadata: WorkflowClassMetadata; steps: Array<WorkflowStepMetadata & { method: string | symbol }>; }

/** Discovers workflow and durable step declarations from Nest providers/controllers. */
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
      const steps: DiscoveredWorkflowClass['steps'] = [];
      for (const name of Object.getOwnPropertyNames(type.prototype)) {
        if (name === 'constructor') continue;
        const step = Reflect.getMetadata(WORKFLOW_STEP_METADATA, type.prototype, name) as WorkflowStepMetadata | undefined;
        if (step) steps.push({ ...step, method: name });
      }
      result.push({ type, metadata, steps });
    }
    return result;
  }

  compile<TInput = unknown, TContext extends WorkflowContext<TInput> = WorkflowContext<TInput>>(instance: object): WorkflowDefinition<TInput, TContext> {
    const discovered = this.collect().find((item) => item.type === instance.constructor);
    if (!discovered) throw new Error(`Workflow metadata not found for ${instance.constructor.name}`);
    const steps = discovered.steps.map((step) => {
      const method = (instance as Record<string, (...args: unknown[]) => unknown>)[String(step.method)];
      if (typeof method !== 'function') throw new Error(`Workflow step method ${String(step.method)} is not callable.`);
      const compensate = step.compensateMethod ? async (context: TContext, result?: unknown) => {
        const compensateMethod = (instance as Record<string, (...args: unknown[]) => unknown>)[step.compensateMethod!];
        if (typeof compensateMethod !== 'function') throw new Error(`Workflow compensation method ${step.compensateMethod} is not callable.`);
        await compensateMethod.call(instance, context, result);
      } : undefined;
      return { name: step.name, retry: step.retry, execute: async (context: TContext) => method.call(instance, context), compensate };
    });
    return { name: discovered.metadata.name, version: discovered.metadata.version ?? '1', steps, metadata: { ...discovered.metadata } };
  }
}
