/**
 * Generic Workflow Worker entrypoint.
 *
 * Application-specific workflow handlers are imported and registered by the
 * deployment bundle. Registry stores their metadata; this Worker stores and
 * executes the actual code through native Cloudflare Workflows.
 */
import { createWorkflowRuntimeApp } from './app';

export { FigentraWorkflowRuntime } from './workflow.runtime';
export { registerWorkflow, resolveWorkflow, listRegisteredWorkflows } from './workflow.registry';
export type { WorkflowHandler, WorkflowInvocation } from './workflow.types';

export default createWorkflowRuntimeApp();
