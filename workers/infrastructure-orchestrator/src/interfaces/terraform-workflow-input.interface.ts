/**
 * @file terraform-workflow-input.interface.ts
 * @description Durable Workflow input for one approved Terraform operation.
 */
import type { TerraformOperation } from "../types/terraform-operation.type.js";

export interface TerraformWorkflowInput {
  readonly jobId: string;
  readonly environment: "development" | "staging" | "production";
  readonly operation: TerraformOperation;
  readonly revision: string;
  readonly workspace: string;
  readonly reason: string;
  readonly approvalRef?: string;
}
