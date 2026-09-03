/**
 * @file job.service.ts
 * @description Durable D1 persistence for infrastructure execution requests.
 */
import type { OrchestratorBindings } from '../interfaces/orchestrator-bindings.interface';
import type { TerraformOperation } from '../types/terraform-operation.type';

/**
 * Creates a durable infrastructure job record before execution is dispatched.
 */
export async function createJob(env: OrchestratorBindings, input: { environment: string; operation: TerraformOperation; revision: string; workspace: string; reason: string; approvalRef?: string; actorId: string }): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO infrastructure_jobs (id, environment, operation, revision, workspace, reason, approval_ref, actor_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`).bind(id, input.environment, input.operation, input.revision, input.workspace, input.reason, input.approvalRef ?? null, input.actorId, now, now).run();
  return id;
}

/**
 * Marks a Terraform job as running.
 */
export async function markJobRunning(env: OrchestratorBindings, jobId: string): Promise<void> {
  await env.DB.prepare(`UPDATE infrastructure_jobs SET status = 'running', updated_at = ? WHERE id = ?`).bind(new Date().toISOString(), jobId).run();
}

/**
 * Marks a Terraform job as completed or failed and stores bounded diagnostics.
 */
export async function markJobFinished(env: OrchestratorBindings, jobId: string, status: 'succeeded' | 'failed', exitCode: number, stdout: string, stderr: string): Promise<void> {
  await env.DB.prepare(`UPDATE infrastructure_jobs SET status = ?, exit_code = ?, stdout = ?, stderr = ?, updated_at = ? WHERE id = ?`).bind(status, exitCode, stdout.slice(-20000), stderr.slice(-20000), new Date().toISOString(), jobId).run();
}

/** Marks a workflow-level failure when execution itself could not reach the runner. */
export async function markJobFailed(env: OrchestratorBindings, jobId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await env.DB.prepare(
    `UPDATE infrastructure_jobs SET status = 'failed', exit_code = -1, stderr = ?, updated_at = ? WHERE id = ? AND status IN ('queued','running')`,
  ).bind(message.slice(-20000), new Date().toISOString(), jobId).run();
}
