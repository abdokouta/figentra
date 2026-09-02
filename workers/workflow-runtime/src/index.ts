/**
 * Generic Workflow Worker entrypoint.
 *
 * Application-specific workflow handlers are imported and registered by the
 * deployment bundle. Registry stores their metadata; this Worker stores and
 * executes the actual code through native Cloudflare Workflows.
 */
import { createWorkflowRuntimeApp } from './app.js';

export { FigentraWorkflowRuntime } from './workflow.runtime.js';
export { registerWorkflow, resolveWorkflow, listRegisteredWorkflows } from './workflow.registry.js';
export type { WorkflowHandler, WorkflowInvocation } from './workflow.types.js';

export default createWorkflowRuntimeApp();
