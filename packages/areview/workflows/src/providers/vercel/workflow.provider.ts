import type { WorkflowExecution, WorkflowProvider, WorkflowProviderCapabilities, WorkflowStartRequest, WorkflowSignalRequest } from '../../contracts/workflow.types.js';

export interface VercelWorkflowHandle { workflowRunId: string; status?: string; }
export interface VercelWorkflowRuntime { start(workflow: string, payload: unknown, options?: { id?: string; metadata?: Record<string, unknown> }): Promise<VercelWorkflowHandle>; get(runId: string): Promise<VercelWorkflowHandle>; cancel?(runId: string): Promise<void>; }

export class VercelWorkflowProvider implements WorkflowProvider {
  readonly kind = 'vercel' as const;
  readonly capabilities: WorkflowProviderCapabilities = { cancel: true };
  constructor(private readonly runtime: VercelWorkflowRuntime) {}
  async start<TPayload>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { const run = await this.runtime.start(request.workflow, request.payload, { id: request.id, metadata: request.metadata }); return { id: run.workflowRunId, workflow: request.workflow, version: request.version, provider: 'vercel', status: this.status(run.status), metadata: request.metadata }; }
  async get(executionId: string): Promise<WorkflowExecution> { const run = await this.runtime.get(executionId); return { id: run.workflowRunId, workflow: 'unknown', provider: 'vercel', status: this.status(run.status) }; }
  async signal<TPayload>(_request: WorkflowSignalRequest<TPayload>): Promise<void> { throw new Error('Vercel Workflow provider requires a workflow-specific webhook/event mechanism for signaling.'); }
  async cancel(executionId: string): Promise<void> { if (!this.runtime.cancel) throw new Error('Vercel Workflow runtime does not expose cancel through the configured adapter.'); await this.runtime.cancel(executionId); }
  private status(value?: string): WorkflowExecution['status'] { const v=value?.toLowerCase(); if(v?.includes('complete')||v==='succeeded') return 'succeeded'; if(v?.includes('fail')||v==='errored') return 'failed'; if(v?.includes('cancel')) return 'cancelled'; if(v?.includes('pause')) return 'paused'; return 'running'; }
}
