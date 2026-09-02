import type { WorkflowExecution, WorkflowProvider, WorkflowProviderCapabilities, WorkflowStartRequest, WorkflowSignalRequest } from '../../contracts/workflow.types.js';

export interface TemporalWorkflowHandle {
  workflowId: string;
  result(): Promise<unknown>;
  signal(name: string, payload?: unknown): Promise<void>;
  cancel(): Promise<void>;
  terminate(reason?: string): Promise<void>;
  describe?(): Promise<{ status?: string }>;
}
export interface TemporalWorkflowClient {
  start(workflow: string, options: { taskQueue: string; workflowId: string; args: unknown[] }): Promise<TemporalWorkflowHandle>;
  getHandle(workflowId: string): TemporalWorkflowHandle;
}

export class TemporalWorkflowProvider implements WorkflowProvider {
  readonly kind = 'temporal' as const;
  readonly capabilities: WorkflowProviderCapabilities = { signal: true, cancel: true, terminate: true };
  constructor(private readonly client: TemporalWorkflowClient, private readonly taskQueue: string) {}
  async start<TPayload>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { const id = request.id ?? crypto.randomUUID(); const handle = await this.client.start(request.workflow, { taskQueue: this.taskQueue, workflowId: id, args: [request.payload, request.metadata] }); return { id: handle.workflowId, workflow: request.workflow, version: request.version, provider: 'temporal', status: 'running', metadata: request.metadata }; }
  async get(executionId: string): Promise<WorkflowExecution> { const handle = this.client.getHandle(executionId); const described = handle.describe ? await handle.describe() : undefined; return { id: executionId, workflow: 'unknown', provider: 'temporal', status: this.status(described?.status) }; }
  async signal<TPayload>(request: WorkflowSignalRequest<TPayload>): Promise<void> { await this.client.getHandle(request.executionId).signal(request.signal, request.payload); }
  async cancel(executionId: string): Promise<void> { await this.client.getHandle(executionId).cancel(); }
  async terminate(executionId: string): Promise<void> { await this.client.getHandle(executionId).terminate(); }
  private status(value?: string): WorkflowExecution['status'] { const v = value?.toLowerCase(); if (v?.includes('complete')) return 'succeeded'; if (v?.includes('fail')) return 'failed'; if (v?.includes('cancel')) return 'cancelled'; return 'running'; }
}
