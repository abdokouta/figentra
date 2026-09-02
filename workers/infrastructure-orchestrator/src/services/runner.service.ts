/**
 * @file runner.service.ts
 * @description Secure bridge from the Worker control plane to the Terraform container.
 */
import { getContainer } from '@cloudflare/containers';
import type { OrchestratorBindings } from '../interfaces/orchestrator-bindings.interface.js';
import type { TerraformWorkflowInput } from '../interfaces/terraform-workflow-input.interface.js';

/**
 * Starts and executes one immutable Terraform job inside the isolated runner.
 */
export async function executeTerraformJob(env: OrchestratorBindings, input: TerraformWorkflowInput): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const runner = getContainer(env.TERRAFORM_RUNNER, input.jobId);
  if (!runner.running) {
    await runner.start({ envVars: {
      FIGENTRA_JOB_ID: input.jobId,
      FIGENTRA_ENVIRONMENT: input.environment,
      FIGENTRA_TERRAFORM_OPERATION: input.operation,
      FIGENTRA_TERRAFORM_REVISION: input.revision,
      FIGENTRA_TERRAFORM_WORKSPACE: input.workspace,
      FIGENTRA_APPROVAL_REF: input.approvalRef ?? "",
      FIGENTRA_TERRAFORM_REPOSITORY: env.TERRAFORM_REPOSITORY,
      FIGENTRA_TERRAFORM_GIT_TOKEN: env.TERRAFORM_GIT_TOKEN,
    }});
  }
  return runner.runEntrypoint();
}
