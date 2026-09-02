import type { WorkflowExecution, WorkflowProvider, WorkflowProviderCapabilities, WorkflowStartRequest, WorkflowSignalRequest } from '../../contracts/workflow.types.js';

export interface CloudflareWorkflowInstance { id: string; status?: string; }
export interface CloudflareWorkflowBinding { create(options: { id?: string; params: unknown }): Promise<CloudflareWorkflowInstance>; get(id: string): Promise<CloudflareWorkflowInstance>; }

export class CloudflareWorkflowProvider implements WorkflowProvider {
  readonly kind = 'cloudflare' as const;
  readonly capabilities: WorkflowProviderCapabilities = { signal: false, cancel: true, terminate: true, pause: true, resume: true, waitForEvent: true };
  constructor(private readonly binding: CloudflareWorkflowBinding, private readonly workflowName: string, private readonly version?: string) {}
  async start<TPayload>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> {
    const instance = await this.binding.create({ id: request.id, params: { workflow: request.workflow, version: request.version ?? this.version, payload: request.payload, metadata: request.metadata } });
    return this.map(instance, request.workflow, request.version ?? this.version);
  }
  async get(executionId: string): Promise<WorkflowExecution> { return this.map(await this.binding.get(executionId), this.workflowName, this.version); }
  async cancel(executionId: string): Promise<void> { const instance = await this.binding.get(executionId) as CloudflareWorkflowInstance & { terminate?: () => Promise<void> }; if (instance.terminate) await instance.terminate(); }
  async terminate(executionId: string): Promise<void> { return this.cancel(executionId); }
  async pause(executionId: string): Promise<void> { const instance = await this.binding.get(executionId) as CloudflareWorkflowInstance & { pause?: () => Promise<void> }; if (instance.pause) await instance.pause(); }
  async resume(executionId: string): Promise<void> { const instance = await this.binding.get(executionId) as CloudflareWorkflowInstance & { resume?: () => Promise<void> }; if (instance.resume) await instance.resume(); }
  async signal<TPayload>(_request: WorkflowSignalRequest<TPayload>): Promise<void> { throw new Error('Cloudflare Workflow provider does not expose a generic signal contract through this adapter. Use workflow-specific event APIs.'); }
  private map(instance: CloudflareWorkflowInstance, workflow: string, version?: string): WorkflowExecution { return { id: instance.id, workflow, version, provider: 'cloudflare', status: this.status(instance.status) }; }
  private status(value?: string): WorkflowExecution['status'] { return value === 'complete' ? 'succeeded' : value === 'errored' ? 'failed' : value === 'paused' ? 'paused' : 'running'; }
}
