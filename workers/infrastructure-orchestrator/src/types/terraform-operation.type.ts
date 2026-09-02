/**
 * @file terraform-operation.type.ts
 * @description Allowed Terraform operations exposed by the orchestration API.
 */

/**
 * Terraform operation modes supported by the control plane.
 */
export type TerraformOperation = 'plan' | 'apply' | 'destroy';
