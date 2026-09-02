import type { WorkflowExecution, WorkflowProvider, WorkflowProviderCapabilities, WorkflowStartRequest, WorkflowSignalRequest } from '../../contracts/workflow.types';

export interface VercelWorkflowHandle { workflowRunId: string; workflow?: string; version?: string; status?: string; metadata?: Record<string, unknown>; }
export interface VercelWorkflowRuntime { start(workflow: string, payload: unknown, options?: { id?: string; version?: string; metadata?: Record<string, unknown> }): Promise<VercelWorkflowHandle>; get(runId: string): Promise<VercelWorkflowHandle>; cancel?(runId: string): Promise<void>; }

export class VercelWorkflowProvider implements WorkflowProvider {
  readonly kind = 'vercel' as const;
  readonly capabilities: WorkflowProviderCapabilities = { cancel: true, signal: false, terminate: false, pause: false, resume: false, waitForEvent: true, query: true };
  constructor(private readonly runtime: VercelWorkflowRuntime) { }
  async start<TPayload>(request: WorkflowStartRequest<TPayload>): Promise<WorkflowExecution> { const run = await this.runtime.start(request.workflow, request.payload, { id: request.id, version: request.version, metadata: request.metadata }); return { id: run.workflowRunId, workflow: run.workflow ?? request.workflow, version: run.version ?? request.version, provider: this.kind, status: this.status(run.status), metadata: run.metadata ?? request.metadata }; }
  async get(executionId: string): Promise<WorkflowExecution> { const run = await this.runtime.get(executionId); return { id: run.workflowRunId, workflow: run.workflow ?? 'unknown', version: run.version, provider: this.kind, status: this.status(run.status), metadata: run.metadata }; }
  async signal<TPayload>(_request: WorkflowSignalRequest<TPayload>): Promise<void> { throw new Error('Vercel Workflow provider does not expose a generic signal contract through this adapter.'); }
  async cancel(executionId: string): Promise<void> { if (!this.runtime.cancel) throw new Error('Vercel Workflow runtime does not expose cancellation.'); await this.runtime.cancel(executionId); }
  private status(value?: string): WorkflowExecution['status'] { const v = value?.toLowerCase(); if (v?.includes('complete') || v === 'succeeded') return 'succeeded'; if (v?.includes('fail') || v === 'errored') return 'failed'; if (v?.includes('cancel')) return 'cancelled'; if (v?.includes('pause')) return 'paused'; if (v?.includes('terminate')) return 'terminated'; return 'running'; }
}
