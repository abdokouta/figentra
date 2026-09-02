import type { Workflow } from "cloudflare:workers";
import type { TerraformRunner } from "../terraform-runner.js";

/**
 * @file orchestrator-bindings.interface.ts
 * @description Cloudflare bindings for the infrastructure orchestration control plane.
 */

/**
 * Runtime bindings used to authenticate and persist Terraform jobs.
 */
export interface OrchestratorBindings {
  /** D1 database containing orchestration job state and audit records. */
  readonly DB: D1Database;
  /** Terraform runner container namespace. */
  readonly TERRAFORM_RUNNER: DurableObjectNamespace<TerraformRunner>;
  /** Identity JWKS endpoint. */
  readonly IDENTITY_JWKS_URL: string;
  /** Trusted Identity issuer. */
  readonly IDENTITY_ISSUER: string;
  /** Orchestrator API audience. */
  readonly IDENTITY_AUDIENCE: string;
  /** IAM permission required for plan/apply operations. */
  readonly PLAN_PERMISSION: string;
  readonly APPLY_PERMISSION: string;
  /** IAM permission required for destroy operations. */
  readonly DESTROY_PERMISSION: string;
  /** Allowed repository identifier for Terraform source. */
  readonly TERRAFORM_REPOSITORY: string;
  /** Repository access token used only by the isolated runner. */
  readonly TERRAFORM_GIT_TOKEN: string;
  /** Durable Workflow used for long-running execution. */
  readonly INFRA_WORKFLOW: Workflow;
  /** Optional audit log level. */
  readonly LOG_LEVEL?: string;
}
