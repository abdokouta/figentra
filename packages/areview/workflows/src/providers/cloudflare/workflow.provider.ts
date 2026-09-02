import type { WorkflowExecution, WorkflowProvider, WorkflowProviderCapabilities, WorkflowStartRequest, WorkflowSignalRequest } from '../../contracts/workflow.types.js';

export interface CloudflareWorkflowInstance { id: string; status?: string; pause?(): Promise<void>; resume?(): Promise<void>; terminate?(): Promise<void>; }
export interface CloudflareWorkflowBinding { create(options: { id?: string; params: unknown }): Promise<CloudflareWorkflowInstance>; get(id: string): Promise<CloudflareWorkflowInstance>; }

export class CloudflareWorkflowProvider implements WorkflowProvider {
  readonly kind = 'cloudflare' as const;
  readonly capabilities: WorkflowProviderCapabilities = { signal: false, cancel: true, terminate: true, pause: true, resume: true, waitForEvent: true, query: true };
  constructor(private readonly binding: CloudflareWorkflowBinding, private readonly workflowName?: string, private readonly version?: string) {}
  async start<TPayload>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { const workflow = request.workflow || this.workflowName; if (!workflow) throw new Error('Cloudflare workflow name is required.'); const instance = await this.binding.create({ id: request.id, params: { workflow, version: request.version ?? this.version, payload: request.payload, metadata: request.metadata } }); return this.map(instance, workflow, request.version ?? this.version, request.metadata); }
  async get(executionId: string): Promise<WorkflowExecution> { const instance = await this.binding.get(executionId); return this.map(instance, this.workflowName ?? 'unknown', this.version); }
  async cancel(executionId: string): Promise<void> { await this.terminate(executionId); }
  async terminate(executionId: string): Promise<void> { const instance = await this.binding.get(executionId); if (!instance.terminate) throw new Error('Cloudflare workflow binding does not expose terminate().'); await instance.terminate(); }
  async pause(executionId: string): Promise<void> { const instance = await this.binding.get(executionId); if (!instance.pause) throw new Error('Cloudflare workflow binding does not expose pause().'); await instance.pause(); }
  async resume(executionId: string): Promise<void> { const instance = await this.binding.get(executionId); if (!instance.resume) throw new Error('Cloudflare workflow binding does not expose resume().'); await instance.resume(); }
  async signal<TPayload>(_request: WorkflowSignalRequest<TPayload>): Promise<void> { throw new Error('Cloudflare Workflow generic signals are not exposed by this adapter; use a workflow-specific event/HTTP trigger.'); }
  private map(instance: CloudflareWorkflowInstance, workflow: string, version?: string, metadata?: Record<string, unknown>): WorkflowExecution { return { id: instance.id, workflow, version, provider: this.kind, status: this.status(instance.status), metadata }; }
  private status(value?: string): WorkflowExecution['status'] { const v = value?.toLowerCase(); if (v === 'complete' || v === 'completed' || v === 'succeeded') return 'succeeded'; if (v === 'errored' || v === 'failed') return 'failed'; if (v === 'paused') return 'paused'; if (v === 'terminated') return 'terminated'; if (v === 'cancelled' || v === 'canceled') return 'cancelled'; return 'running'; }
}
