import type { WorkflowProvider, WorkflowStartRequest, WorkflowExecution, WorkflowSignalRequest } from './contracts/workflow.types.js';

export interface WorkflowClientOptions { provider: WorkflowProvider }

/** Provider-neutral facade; applications do not depend on a workflow vendor. */
export class WorkflowClient {
  constructor(private readonly options: WorkflowClientOptions) {}
  start<TPayload = unknown>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { return this.options.provider.start(request); }
  get(executionId: string): Promise<WorkflowExecution | undefined> { return this.options.provider.get(executionId); }
  signal<TPayload = unknown>(request: WorkflowSignalRequest<TPayload>): Promise<void> { if (!this.options.provider.signal) throw new Error(`Workflow provider ${this.options.provider.kind} does not support generic signals.`); return this.options.provider.signal(request); }
  cancel(executionId: string): Promise<void> { if (!this.options.provider.cancel) throw new Error(`Workflow provider ${this.options.provider.kind} does not support cancellation.`); return this.options.provider.cancel(executionId); }
}
