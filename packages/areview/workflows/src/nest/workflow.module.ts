import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { WorkflowClient, type WorkflowClientOptions } from '../client.js';
import { WorkflowDiscoveryService } from './workflow.discovery.service.js';

/** Nest configuration for the Workflow Runtime client. */
export interface WorkflowModuleOptions extends WorkflowClientOptions {}

/** DI token for the framework-neutral workflow client. */
export const WORKFLOW_CLIENT = Symbol('FIGENTRA_WORKFLOW_CLIENT');

/** Nest composition module for workflow discovery and runtime client access. */
@Module({ imports: [DiscoveryModule], providers: [WorkflowDiscoveryService], exports: [WorkflowDiscoveryService] })
export class WorkflowModule {
  static forRoot(options: WorkflowModuleOptions): DynamicModule {
    return {
      module: WorkflowModule,
      imports: [DiscoveryModule],
      providers: [
        WorkflowDiscoveryService,
        { provide: WORKFLOW_CLIENT, useValue: new WorkflowClient(options) },
      ],
      exports: [WorkflowDiscoveryService, WORKFLOW_CLIENT],
    };
  }
}
