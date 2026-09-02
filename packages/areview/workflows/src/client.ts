import type { WorkflowProvider, WorkflowStartRequest, WorkflowExecution, WorkflowSignalRequest } from './contracts/workflow.types.js';

export interface WorkflowClientOptions { provider: WorkflowProvider }

/** Provider-neutral facade; applications do not depend on a workflow vendor. */
export class WorkflowClient {
  constructor(private readonly options: WorkflowClientOptions) {}
  get provider(): WorkflowProvider { return this.options.provider; }
  supports(capability: keyof WorkflowProvider['capabilities']): boolean { return this.options.provider.capabilities[capability]; }
  start<TPayload = unknown>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { return this.options.provider.start(request); }
  get(executionId: string): Promise<WorkflowExecution | undefined> { return this.options.provider.get(executionId); }
  signal<TPayload = unknown>(request: WorkflowSignalRequest<TPayload>): Promise<void> { if (!this.options.provider.capabilities.signal || !this.options.provider.signal) throw new Error(`Workflow provider ${this.options.provider.kind} does not support signals.`); return this.options.provider.signal(request); }
  cancel(executionId: string): Promise<void> { if (!this.options.provider.capabilities.cancel || !this.options.provider.cancel) throw new Error(`Workflow provider ${this.options.provider.kind} does not support cancellation.`); return this.options.provider.cancel(executionId); }
  terminate(executionId: string): Promise<void> { if (!this.options.provider.capabilities.terminate || !this.options.provider.terminate) throw new Error(`Workflow provider ${this.options.provider.kind} does not support termination.`); return this.options.provider.terminate(executionId); }
  pause(executionId: string): Promise<void> { if (!this.options.provider.capabilities.pause || !this.options.provider.pause) throw new Error(`Workflow provider ${this.options.provider.kind} does not support pause.`); return this.options.provider.pause(executionId); }
  resume(executionId: string): Promise<void> { if (!this.options.provider.capabilities.resume || !this.options.provider.resume) throw new Error(`Workflow provider ${this.options.provider.kind} does not support resume.`); return this.options.provider.resume(executionId); }
}
