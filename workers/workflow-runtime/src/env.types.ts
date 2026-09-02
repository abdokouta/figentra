/** Runtime environment contract for the generic Workflow Worker. */
export interface WorkflowRuntimeEnv {
  WORKFLOW_RUNTIME: Workflow;
  IDENTITY_JWKS_URL: string;
  IDENTITY_ISSUER: string;
  IDENTITY_AUDIENCE: string;
  WORKFLOW_EXECUTE_PERMISSION: string;
  LOG_LEVEL: string;
}
